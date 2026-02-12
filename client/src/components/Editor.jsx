import React, { useEffect, useRef } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react'; // Alias to avoid conflict if any, though not needed here
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange, language }) => {
    const editorRef = useRef(null);

    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;
        
        // Initial code logic could go here if needed
        editor.onDidChangeModelContent((event) => {
             const code = editor.getValue();
             onCodeChange(code);
             if (event.isFlush) {
                 // Ignore flush events (e.g. initial setValue) if needed, but usually we handle origin
             }
        });
    }

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null && editorRef.current) {
                    const currentCode = editorRef.current.getValue();
                    if (code !== currentCode) {
                         editorRef.current.setValue(code);
                    }
                }
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.CODE_CHANGE);
            }
        };
    }, [socketRef.current]);

    return (
        <div style={{ height: '100%' }}>
            <MonacoEditor
                height="100%"
                language={language || 'javascript'}
                defaultValue="// Write your code here"
                theme="vs-dark"
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 20,
                    wordWrap: 'on',
                    automaticLayout: true,
                }}
            />
        </div>
    );
};

export default Editor;
