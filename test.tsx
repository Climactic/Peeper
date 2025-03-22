import Editor from "@monaco-editor/react";
import { useRef } from "react";
import { create } from "zustand";

// Define Zustand store for query management
const useQueryStore = create((set, get) => ({
    // Current query being edited
    currentQuery: "SELECT * FROM users LIMIT 10;",
    setCurrentQuery: (query) => set({ currentQuery: query }),

    // Query history
    queryHistory: [],
    addToHistory: (query, success = true, timestamp = new Date().toISOString()) => {
        // Don't add duplicate consecutive queries
        const history = get().queryHistory;
        if (history.length > 0 && history[0].query === query) {
            return;
        }

        set((state) => ({
            queryHistory: [{ id: Date.now(), query, success, timestamp }, ...state.queryHistory].slice(0, 50), // Limit history to 50 items
        }));
    },
    clearHistory: () => set({ queryHistory: [] }),

    // Query execution state
    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),

    // Query results
    results: [],
    setResults: (results) => set({ results }),

    // Error state
    error: null,
    setError: (error) => set({ error }),

    // Execute query function
    executeQuery: async () => {
        const { currentQuery, setIsLoading, setResults, setError, addToHistory } = get();

        setIsLoading(true);
        setError(null);

        try {
            // Assuming these values would come from your application context or state
            const connection = { id: 1 /* other connection properties */ };
            const database = "my_database";

            // Call your PHP function (via API in this example)
            const response = await fetch("/api/execute-query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    connection_id: connection.id,
                    database: database,
                    query: currentQuery,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setResults(data);

            // Add successful query to history
            addToHistory(currentQuery, true);

            return data;
        } catch (err) {
            const errorMessage = err.message || "An error occurred while executing the query";
            setError(errorMessage);

            // Add failed query to history
            addToHistory(currentQuery, false);

            return null;
        } finally {
            setIsLoading(false);
        }
    },

    // Load a query from history
    loadQueryFromHistory: (historyItem) => {
        set({ currentQuery: historyItem.query });
    },
}));

// Query History Component
function QueryHistory() {
    const { queryHistory, loadQueryFromHistory, clearHistory } = useQueryStore();

    if (queryHistory.length === 0) {
        return <div className="query-history-empty">No query history yet</div>;
    }

    return (
        <div className="query-history">
            <div className="query-history-header">
                <h3>Query History</h3>
                <button onClick={clearHistory} className="clear-history-btn" style={{ marginLeft: "auto", padding: "4px 8px" }}>
                    Clear History
                </button>
            </div>
            <div className="query-history-list" style={{ maxHeight: "200px", overflow: "auto" }}>
                {queryHistory.map((item) => (
                    <div
                        key={item.id}
                        className={`history-item ${item.success ? "success" : "error"}`}
                        onClick={() => loadQueryFromHistory(item)}
                        style={{
                            padding: "8px",
                            margin: "4px 0",
                            cursor: "pointer",
                            borderLeft: `4px solid ${item.success ? "#4CAF50" : "#f44336"}`,
                            backgroundColor: "#f5f5f5",
                            borderRadius: "2px",
                        }}
                    >
                        <div
                            className="history-query"
                            style={{ fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                            {item.query.length > 60 ? item.query.substring(0, 60) + "..." : item.query}
                        </div>
                        <div className="history-meta" style={{ fontSize: "0.8em", color: "#666" }}>
                            {new Date(item.timestamp).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Main Query Editor Component
function QueryEditor() {
    const { currentQuery, setCurrentQuery, executeQuery, isLoading, results, error } = useQueryStore();

    const editorRef = useRef(null);

    // Handle editor mounting
    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;

        // Configure Monaco editor for SQL
        monaco.languages.registerCompletionItemProvider("sql", {
            provideCompletionItems: () => {
                return {
                    suggestions: [
                        {
                            label: "SELECT",
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            insertText: "SELECT",
                        },
                        {
                            label: "FROM",
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            insertText: "FROM",
                        },
                        {
                            label: "WHERE",
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            insertText: "WHERE",
                        },
                        // Add more SQL keywords as needed
                    ],
                };
            },
        });

        // Add keyboard shortcut for executing query (Ctrl+Enter)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, executeQuery);
    }

    // Handle content changes
    function handleEditorChange(value) {
        setCurrentQuery(value);
    }

    return (
        <div className="query-editor-container">
            <h2>SQL Query Editor</h2>

            <div className="editor-wrapper" style={{ height: "300px", border: "1px solid #ccc" }}>
                <Editor
                    height="100%"
                    defaultLanguage="sql"
                    value={currentQuery}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        fontSize: 14,
                        wordWrap: "on",
                    }}
                />
            </div>

            <div className="controls" style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                <button
                    onClick={executeQuery}
                    disabled={isLoading}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                >
                    {isLoading ? "Executing..." : "Execute Query (Ctrl+Enter)"}
                </button>

                <button
                    onClick={() => setCurrentQuery("")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#f0f0f0",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                    }}
                >
                    Clear Editor
                </button>
            </div>

            {error && (
                <div
                    className="error"
                    style={{
                        marginTop: "10px",
                        color: "white",
                        backgroundColor: "#f44336",
                        padding: "10px",
                        borderRadius: "4px",
                    }}
                >
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="query-workspace" style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                <div className="history-section" style={{ flex: "1", maxWidth: "300px" }}>
                    <QueryHistory />
                </div>

                <div className="results-section" style={{ flex: "2" }}>
                    {results.length > 0 && (
                        <div className="results">
                            <h3>Results ({results.length} rows)</h3>
                            <div style={{ maxHeight: "300px", overflow: "auto", border: "1px solid #eee" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ position: "sticky", top: 0, backgroundColor: "#f5f5f5" }}>
                                            {Object.keys(results[0]).map((key) => (
                                                <th key={key} style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((row, rowIndex) => (
                                            <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                                                {Object.values(row).map((value, cellIndex) => (
                                                    <td key={cellIndex} style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {value === null ? (
                                                            <span style={{ color: "#999", fontStyle: "italic" }}>NULL</span>
                                                        ) : typeof value === "object" ? (
                                                            JSON.stringify(value)
                                                        ) : (
                                                            String(value)
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QueryEditor;
