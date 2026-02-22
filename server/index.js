const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const ACTIONS = require('./Actions');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const Room = require('./models/Room');

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev to avoid CORS issues if port changes
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    transports: ['websocket', 'polling']
});

app.use(express.json());
app.use(cors());

// Health Check / Wake up route
app.get('/ping', (req, res) => res.send('pong'));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const userSocketMap = {};
const dbDebounce = {}; // Map to store debounce timers for saving code
const saveLanguageDebounce = {}; // Debounce for language
const roomState = {}; // In-memory store for pending changes


function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, async ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        // Check if room exists in DB and load code if room is empty in memory (first user)
        const clients = getAllConnectedClients(roomId);
        // If only 1 client (self), load from DB
        if (clients.length === 1) {
            try {
                let room = await Room.findOne({ roomId });
                if (room) {
                    io.to(roomId).emit(ACTIONS.CODE_CHANGE, { code: room.code });
                    io.to(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language: room.language });
                } else {
                    // Create new room in DB if not exists
                    await Room.create({ roomId, code: '// Write your code here', language: 'javascript' });
                }
            } catch (err) {
                console.error("Error loading room from DB:", err);
            }
        }

        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code, cursor }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { 
            code, 
            cursor, // Forward cursor position (optional)
            socketId: socket.id,
            username: userSocketMap[socket.id]
        });
        
        // Save to DB (Debounced)
        if (dbDebounce[roomId]) clearTimeout(dbDebounce[roomId]);

        roomState[roomId] = { ...roomState[roomId], code };
        
        dbDebounce[roomId] = setTimeout(async () => {
             try {
                 await Room.findOneAndUpdate({ roomId }, { code }, { upsert: true });
                 delete dbDebounce[roomId];
                 delete roomState[roomId]; // Clean up memory if saved successfully? No, keep it as "latest state" just in case.
                 // Actually, if we don't delete, memory grows. But wait, we only use roomState if debounce exists.
                 // If we successfully save, debounce is gone. So we can clear roomState[roomId].code maybe?
                 // But multiple clients might be emitting.
                 // Let's just update roomState. We can clear it on room close or empty.
             } catch (err) {
                 console.error("Error saving code to DB:", err);
             }
        }, 1000); // 1-second debounce (prevents spamming DB)
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
        io.to(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
        
        // Save to DB (Debounced)
        if (saveLanguageDebounce[roomId]) clearTimeout(saveLanguageDebounce[roomId]);

        roomState[roomId] = { ...roomState[roomId], language };
        
        saveLanguageDebounce[roomId] = setTimeout(async () => {
             try {
                 await Room.findOneAndUpdate({ roomId }, { language }, { upsert: true });
                 delete saveLanguageDebounce[roomId];
             } catch (err) {
                 console.error("Error saving language to DB:", err);
             }
        }, 500);
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code, language }) => { // Sync language too
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
        if(language) io.to(socketId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    });

    socket.on(ACTIONS.CURSOR_CHANGE, ({ roomId, cursor }) => {
        socket.in(roomId).emit(ACTIONS.CURSOR_CHANGE, {
            socketId: socket.id,
            cursor,
            username: userSocketMap[socket.id]
        });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });

            // Flush changes to DB if there's a pending debounce and this is the last user (or just to be safe)
            // Actually, we should just save if we have pending changes.
            if (dbDebounce[roomId]) {
                clearTimeout(dbDebounce[roomId]);
                delete dbDebounce[roomId];
                if (roomState[roomId]?.code) {
                    Room.findOneAndUpdate({ roomId }, { code: roomState[roomId].code }, { upsert: true }).catch(err => console.error(err));
                }
            }
             if (saveLanguageDebounce[roomId]) {
                clearTimeout(saveLanguageDebounce[roomId]);
                delete saveLanguageDebounce[roomId];
                if (roomState[roomId]?.language) {
                    Room.findOneAndUpdate({ roomId }, { language: roomState[roomId].language }, { upsert: true }).catch(err => console.error(err));
                }
            }
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;

// Proxy Execution Route (Keyless Multi-Engine with Debugging)
app.post('/api/execute', async (req, res) => {
    const { language, files } = req.body;
    const code = files[0]?.content || "";
    let lastError = "No runner attempted";

    const runners = [
        // 1. Pydis (The most stable Piston mirror)
        async () => {
            const resp = await axios.post('https://piston.pydis.com/api/v2/execute', {
                language, version: "*", files: [{ name: "index", content: code }]
            }, { 
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000 
            });
            return resp.data;
        },
        
        // 2. Glot.io (High reliability fallback)
        async () => {
            const langMap = { 'javascript': 'javascript', 'python': 'python', 'java': 'java' };
            const glotLang = langMap[language] || language;
            const resp = await axios.post(`https://glot.io/api/run/${glotLang}/latest`, {
                files: [{ name: "main.js", content: code }]
            }, { timeout: 10000 });
            return { run: { output: resp.data.stdout || resp.data.stderr, stderr: resp.data.stderr || "" } };
        }
    ];

    for (let runTask of runners) {
        try {
            const data = await runTask();
            return res.json(data);
        } catch (e) {
            lastError = e.response?.data?.message || e.message;
            console.error(`Runner failed: ${lastError}`);
            continue;
        }
    }

    // Return the actual error so we can see it in the UI
    res.status(500).json({ 
        message: "Execution engines failed. Last error: " + lastError,
        details: lastError
    });
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
