# Real-Time Code Editor (CodeSync)

A powerful, real-time collaborative code editor that allows multiple users to write code together in the same specific room. Features include syntax highlighting for multiple languages, instant code execution, and a sleek, dark-themed UI.

## 🚀 Features

-   **Real-Time Collaboration**: Code changes are synchronized instantly across all connected clients using Socket.io.
-   **Multi-Language Support**: Syntax highlighting and execution support for JavaScript, Python, Java, C++, and more.
-   **Live Cursor Tracking**: See exactly where other users are typing with color-coded cursors and name labels.
-   **Instant Room Creation**: Generate a unique room ID to invite others.
-   **Code Execution**: Run code directly in the browser and see the output (powered by Piston API).
-   **Persistence**: Code state is automatically saved to MongoDB, ensuring work isn't lost.
-   **Dark Mode UI**: A modern, glassmorphism-inspired interface designed for long coding sessions.

## 🛠 Tech Stack

### Frontend
-   **React.js (Vite)**: Fast and modern UI library.
-   **Monaco Editor**: The same editor engine that powers VS Code.
-   **Socket.io-client**: For real-time bidirectional communication.
-   **Tailwind CSS / Custom CSS**: For styling (verify if Tailwind is used, otherwise just Custom CSS).
-   **React Router**: For client-side routing.
-   **React Hot Toast**: For notifications.

### Backend
-   **Node.js & Express.js**: Server-side runtime and framework.
-   **Socket.io**: Real-time event-based communication.
-   **MongoDB & Mongoose**: Database for storing room states and code.

### External APIs
-   **Piston API**: For safely executing code in a sandboxed environment.

## 📂 Project Structure

```
real-time-code-editor/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components (Editor, Client, Output)
│   │   ├── pages/          # Page components (Home, EditorPage)
│   │   ├── socket.js       # Socket connection logic
│   │   ├── App.jsx         # Main application component
│   │   └── main.jsx        # Entry point
│   ├── package.json        # Client dependencies
│   └── vite.config.js      # Vite configuration
│
├── server/                 # Backend Node.js Application
│   ├── models/             # Mongoose models (Room)
│   ├── Actions.js          # Socket event constants
│   ├── index.js            # Server entry point
│   └── package.json        # Server dependencies
│
└── PROJECT_OVERVIEW.md     # Detailed project documentation
```

## ⚡ Getting Started

### Prerequisites

-   **Node.js** (v14 or higher)
-   **npm** or **yarn**
-   **MongoDB** (Local instance or MongoDB Atlas connection string)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd real-time-code-editor
    ```

2.  **Setup the Server:**
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in the `server` directory and add your MongoDB connection string:
    ```env
    PORT=5000
    MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/codesync
    ```

3.  **Setup the Client:**
    ```bash
    cd ../client
    npm install
    ```
    (Optional) Create a `.env` file in the `client` directory if you want to specify a custom backend URL:
    ```env
    VITE_BACKEND_URL=http://localhost:5000
    ```

### Running the Application

1.  **Start the Backend Server:**
    ```bash
    cd server
    npm run dev
    # Runs on http://localhost:5000
    ```

2.  **Start the Frontend Client:**
    ```bash
    cd client
    npm run dev
    # Runs on http://localhost:5173 (usually)
    ```

3.  **Open your browser** and navigate to the client URL. Create a room and start coding!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.
