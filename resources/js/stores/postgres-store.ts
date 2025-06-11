import { DatabaseConnection } from "@/types/database";
import { Column, Filter, Pagination, Schema, Table, TableRecord } from "@/types/postgres";
import axios, { AxiosError } from "axios";
import { create } from "zustand";

// Define the sorting option interface
interface SortOption {
    id: string;
    column: string;
    direction: "asc" | "desc";
}

// Define query history item interface
interface QueryHistoryItem {
    id: number;
    database_connection_id: number;
    query: string;
    executor: string;
    executor_id: number | null;
    type: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface PostgresStoreState {
    selectedSchema: string | null;
    schemas: Schema[];
    tables: Table[];
    selectedTable: string | null;
    columns: Column[];
    tableData: TableRecord[];
    loading: boolean;
    loadingTable: boolean;
    errorMessage: string | null;
    filters: Filter[];
    sorting: SortOption[];
    pagination: Pagination;

    // Query-related state
    isQueryMode: boolean;
    queryString: string;
    queryHistory: QueryHistoryItem[];
    queryResults: Record<string, unknown>[] | null;
    queryColumns: string[];
    queryError: string | null;
    executingQuery: boolean;
    loadingHistory: boolean;

    // Table Selection
    selectedColumns: Column[];

    setSelectedSchema: (schema: string | null) => void;
    setSchemas: (schemas: Schema[]) => void;
    setTables: (tables: Table[]) => void;
    setSelectedTable: (table: string | null) => void;
    setColumns: (columns: Column[]) => void;
    setTableData: (data: TableRecord[]) => void;
    setLoading: (loading: boolean) => void;
    setLoadingTable: (loading: boolean) => void;
    setErrorMessage: (error: string | null) => void;
    setFilters: (filters: Filter[]) => void;
    setSorting: (sorting: SortOption[]) => void;
    setPagination: (pagination: Partial<Pagination>) => void;

    // Table Selection
    setSelectedColumns: (columns: Column[]) => void;

    // Query-related setters and actions
    setQueryMode: (isActive: boolean) => void;
    setQueryString: (query: string) => void;
    clearQueryResults: () => void;
    executeQuery: (connection: DatabaseConnection) => Promise<void>;
    fetchQueryHistory: (connection: DatabaseConnection) => Promise<void>;

    fetchSchemas: (connection: DatabaseConnection) => Promise<void>;
    fetchTables: (connection: DatabaseConnection) => Promise<void>;
    fetchTableData: (connection: DatabaseConnection, tableNameOverride?: string) => Promise<void>;
    handleTableSelect: (connection: DatabaseConnection, tableName: string) => Promise<void>;
    refreshTableData: (connection: DatabaseConnection) => Promise<void>;
}

export const postgresStore = create<PostgresStoreState>((set, get) => ({
    selectedSchema: null,
    schemas: [],
    tables: [],
    selectedTable: null,
    columns: [],
    tableData: [],
    loading: false,
    loadingTable: false,
    errorMessage: null,
    filters: [],
    sorting: [],
    pagination: {
        page: 1,
        perPage: 20,
        total: 0,
    },

    // Query-related state
    isQueryMode: false,
    queryString: "",
    queryHistory: [],
    queryResults: null,
    queryColumns: [],
    queryError: null,
    executingQuery: false,
    loadingHistory: false,

    // Table Selection
    selectedColumns: [],

    setSelectedSchema: (schema) => set({ selectedSchema: schema }),
    setSchemas: (schemas) => set({ schemas }),
    setTables: (tables) => set({ tables }),
    setSelectedTable: (table) => set({ selectedTable: table }),
    setColumns: (columns) => set({ columns }),
    setTableData: (data) => set({ tableData: data }),
    setLoading: (loading) => set({ loading }),
    setLoadingTable: (loading) => set({ loadingTable: loading }),
    setErrorMessage: (error) => set({ errorMessage: error }),
    setFilters: (filters) => set({ filters }),
    setSorting: (sorting) => set({ sorting }),
    setSelectedColumns: (columns: Column[]) => set({ selectedColumns: columns }),
    setPagination: (paginationUpdate) =>
        set((state) => ({
            pagination: { ...state.pagination, ...paginationUpdate },
        })),

    // Query-related setters and actions
    setQueryMode: (isActive) => {
        const currentQueryMode = get().isQueryMode;

        // Only update if the state is actually changing
        if (currentQueryMode === isActive) {
            return;
        }

        // Clear query results when disabling query mode
        if (!isActive) {
            set({
                isQueryMode: false,
                queryResults: null,
                queryError: null,
                queryColumns: [],
            });
        } else {
            set({ isQueryMode: true });
        }
    },

    setQueryString: (query) => set({ queryString: query }),

    clearQueryResults: () =>
        set({
            queryResults: null,
            queryError: null,
            queryColumns: [],
        }),

    executeQuery: async (connection) => {
        const queryString = get().queryString.trim();
        if (!connection || !queryString) return;

        set({ executingQuery: true, queryError: null });

        try {
            const response = await axios.post(
                route("postgres.query.execute", {
                    connection_id: connection.id,
                    database: connection.database,
                    query: queryString,
                }),
            );

            if (response.data.success) {
                const data = response.data.data;
                // Extract column names from the first result
                const columns = data.length > 0 ? Object.keys(data[0]) : [];
                set({
                    queryResults: data,
                    queryColumns: columns,
                    queryError: null,
                });

                // Fetch query history separately without setting state in executeQuery
                await axios
                    .get(
                        route("postgres.query.history", {
                            connection: connection.id,
                            database: connection.database,
                        }),
                    )
                    .then((historyResponse) => {
                        set({ queryHistory: historyResponse.data || [] });
                    })
                    .catch((error) => {
                        console.error("Failed to fetch query history:", error);
                    });
            } else {
                set({
                    queryResults: null,
                    queryError: response.data.error ? `${response.data.error}\n\nYour query: ${queryString}` : "Unknown error",
                    queryColumns: [],
                });
            }
        } catch (error) {
            console.error("Query execution error:", error);

            // Extract the most useful error information from the response
            let errorMessage = "Failed to execute query";
            let errorDetails = "";

            if (error instanceof Error) {
                errorMessage = error.message;
            }

            // Handle Axios error with response data
            const axiosError = error as {
                response?: {
                    data?: {
                        error?: string;
                        message?: string;
                        sqlState?: string;
                        detail?: string;
                        hint?: string;
                        code?: string;
                        position?: number;
                        query?: string;
                    };
                    status?: number;
                    statusText?: string;
                };
            };

            if (axiosError.response?.data) {
                const responseData = axiosError.response.data;

                // Try to get the most specific error message
                errorMessage =
                    responseData.error || responseData.message || `${axiosError.response.status} ${axiosError.response.statusText}` || errorMessage;

                // Collect additional error details if available
                if (responseData.detail) errorDetails += `\nDetail: ${responseData.detail}`;
                if (responseData.hint) errorDetails += `\nHint: ${responseData.hint}`;
                if (responseData.sqlState) errorDetails += `\nSQL State: ${responseData.sqlState}`;
                if (responseData.code) errorDetails += `\nCode: ${responseData.code}`;
                if (responseData.position) errorDetails += `\nPosition: ${responseData.position}`;
            }

            // Add the original query at the end for context
            errorDetails += `\n\nYour query: ${queryString}`;

            set({
                queryResults: null,
                queryError: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage,
                queryColumns: [],
            });
        } finally {
            set({ executingQuery: false });
        }
    },

    fetchQueryHistory: async (connection) => {
        if (!connection) return;

        // Only set loadingHistory if we don't already have history
        const currentHistory = get().queryHistory;
        if (currentHistory.length === 0) {
            set({ loadingHistory: true });
        }

        try {
            const response = await axios.get(
                route("postgres.query.history", {
                    connection: connection.id,
                    database: connection.database,
                }),
            );

            // Compare current history with new history to avoid unnecessary updates
            const newHistory = response.data || [];
            if (JSON.stringify(currentHistory) !== JSON.stringify(newHistory)) {
                set({ queryHistory: newHistory });
            }
        } catch (error) {
            console.error("Failed to fetch query history:", error);
        } finally {
            set({ loadingHistory: false });
        }
    },

    fetchSchemas: async (connection) => {
        set({ loading: true, errorMessage: null, selectedSchema: null, tables: [] });

        try {
            const schemasResponse = await axios.get(
                route("postgres.schemas", {
                    connection: connection.id,
                    database: connection.database,
                }),
            );

            const schemas = schemasResponse.data;
            set({ schemas });

            const publicSchema = schemas.find((schema: Schema) => schema.schema_name === "public");
            if (publicSchema) {
                set({ selectedSchema: "public" });
            } else if (schemas.length > 0) {
                set({ selectedSchema: schemas[0].schema_name });
            }
        } catch (err) {
            console.error("Error fetching schemas:", err);
            const axiosError = err as AxiosError<{ message: string }>;
            set({ errorMessage: axiosError.response?.data?.message || "Failed to fetch schemas" });
        } finally {
            set({ loading: false });
        }
    },

    fetchTables: async (connection) => {
        const { selectedSchema } = get();
        if (!selectedSchema) return;

        set({ loading: true, errorMessage: null, selectedTable: null });

        try {
            const tablesResponse = await axios.get(
                route("postgres.tables", {
                    connection: connection.id,
                    database: connection.database,
                }),
            );

            const allTables = tablesResponse.data;
            const filteredTables = allTables.filter((table: Table) => table.table_schema === selectedSchema);

            set({ tables: filteredTables });
        } catch (err) {
            console.error("Error fetching tables:", err);
            const axiosError = err as AxiosError<{ message: string }>;
            set({ errorMessage: axiosError.response?.data?.message || "Failed to fetch tables" });
        } finally {
            set({ loading: false });
        }
    },

    fetchTableData: async (connection, tableNameOverride) => {
        const { selectedTable, selectedSchema, pagination, filters, sorting } = get();

        const tableToFetch = tableNameOverride || selectedTable;
        if (!tableToFetch || !selectedSchema) return;

        set({ loadingTable: true, errorMessage: null });

        try {
            const [columnsResponse, dataResponse] = await Promise.all([
                axios.get(
                    route("postgres.columns", {
                        connection: connection.id,
                        database: connection.database,
                        table: tableToFetch,
                        schema: selectedSchema,
                    }),
                ),
                axios.get(
                    route("postgres.data", {
                        connection: connection.id,
                        database: connection.database,
                        table: tableToFetch,
                        page: pagination.page,
                        perPage: pagination.perPage,
                        schema: selectedSchema,
                        filters: filters,
                        sorting: sorting.length > 0 ? sorting.map((s) => ({ column: s.column, direction: s.direction })) : undefined,
                    }),
                ),
            ]);

            const { isQueryMode } = get();

            set({ columns: columnsResponse.data });

            if (dataResponse.data && Array.isArray(dataResponse.data.data)) {
                // Handle case where backend provides data wrapped with pagination metadata
                set({ tableData: dataResponse.data.data });
                if (dataResponse.data.total !== undefined) {
                    set((state) => ({
                        pagination: {
                            ...state.pagination,
                            total: dataResponse.data.total,
                        },
                    }));
                }
            } else {
                // Handle case where backend just returns array of data
                set({ tableData: dataResponse.data });

                // Estimate total based on whether we received a full page of results
                const receivedCount = dataResponse.data.length;
                if (receivedCount < pagination.perPage) {
                    // If we received fewer items than perPage, we're on the last page
                    set((state) => ({
                        pagination: {
                            ...state.pagination,
                            total: (pagination.page - 1) * pagination.perPage + receivedCount,
                        },
                    }));
                } else {
                    // Otherwise, there are at least this many items
                    set((state) => ({
                        pagination: {
                            ...state.pagination,
                            total: Math.max(state.pagination.total, pagination.page * pagination.perPage),
                        },
                    }));
                }
            }

            // If we're in query mode and filters or sorting were applied, refresh query history
            if (isQueryMode && (filters.length > 0 || sorting.length > 0)) {
                // Use a small delay to ensure the backend has time to log the query
                setTimeout(() => {
                    get().fetchQueryHistory(connection);
                }, 200);
            }
        } catch (err) {
            console.error("Error fetching table data:", err);
            const axiosError = err as AxiosError<{ message: string }>;
            set({
                errorMessage: `Error fetching table data: ${axiosError.response?.data?.message || axiosError.message || "Unknown error"}`,
            });
        } finally {
            set({ loadingTable: false });
        }
    },

    handleTableSelect: async (connection, tableName) => {
        const { pagination } = get();

        set({
            selectedTable: tableName,
            pagination: {
                page: 1,
                perPage: pagination.perPage,
                total: 0, // Reset total since we don't know it yet
            },
        });

        // Fetch data passing the tableName directly
        await get().fetchTableData(connection, tableName);
    },

    refreshTableData: async (connection) => {
        const { selectedTable } = get();
        if (selectedTable) {
            await get().fetchTableData(connection, selectedTable);
            
            // If we're in query mode, refresh the query history to show any new filter/sort queries
            const { isQueryMode } = get();
            if (isQueryMode) {
                await get().fetchQueryHistory(connection);
            }
        }
    },
}));
