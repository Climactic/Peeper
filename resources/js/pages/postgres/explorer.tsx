import PostgresContent from "@/components/postgres/postgres-content";
import PostgresMasterSidebar from "@/components/postgres/postgres-master-sidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PostgresContextProvider, usePostgresStore } from "@/contexts/postgres-context";
import AppLayout from "@/layouts/app-layout";
import { postgresStore } from "@/stores/postgres-store";
import { DatabaseConnection } from "@/types/database";
import { Head } from "@inertiajs/react";
import { useCallback, useEffect } from "react";

/**
 * Main component for PostgreSQL database explorer
 */
interface PostgresExplorerProps {
    connection: DatabaseConnection;
    error?: string;
}

const PostgresExplorer = ({ connection, error }: PostgresExplorerProps) => {
    const breadcrumbs = [
        { title: "Postgres", href: route("postgres.index") },
        {
            title: connection.name,
            href: route("postgres.explore", { connection: connection.id }),
        },
    ];

    // Handle connection error
    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex flex-col gap-4 p-4">
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </AppLayout>
        );
    }

    return (
        <PostgresContextProvider store={postgresStore}>
            <ExplorerContent connection={connection} breadcrumbs={breadcrumbs} />
        </PostgresContextProvider>
    );
};

interface ExplorerContentProps {
    connection: DatabaseConnection;
    breadcrumbs: { title: string; href: string }[];
}

const ExplorerContent = ({ connection, breadcrumbs }: ExplorerContentProps) => {
    const selectedSchema = usePostgresStore((state) => state.selectedSchema);
    const schemas = usePostgresStore((state) => state.schemas);
    const tables = usePostgresStore((state) => state.tables);
    const selectedTable = usePostgresStore((state) => state.selectedTable);
    const columns = usePostgresStore((state) => state.columns);
    const tableData = usePostgresStore((state) => state.tableData);
    const loading = usePostgresStore((state) => state.loading);
    const loadingTable = usePostgresStore((state) => state.loadingTable);
    const errorMessage = usePostgresStore((state) => state.errorMessage);
    const pagination = usePostgresStore((state) => state.pagination);
    const isQueryMode = usePostgresStore((state) => state.isQueryMode);
    const queryResults = usePostgresStore((state) => state.queryResults);
    const queryError = usePostgresStore((state) => state.queryError);
    const queryColumns = usePostgresStore((state) => state.queryColumns);

    // Get actions from store
    const setPagination = usePostgresStore((state) => state.setPagination);
    const fetchSchemas = usePostgresStore((state) => state.fetchSchemas);
    const fetchTables = usePostgresStore((state) => state.fetchTables);
    const fetchQueryHistory = usePostgresStore((state) => state.fetchQueryHistory);
    const setSelectedSchema = usePostgresStore((state) => state.setSelectedSchema);
    const storeHandleTableSelect = usePostgresStore((state) => state.handleTableSelect);
    const storeRefreshTableData = usePostgresStore((state) => state.refreshTableData);
    const setFilters = usePostgresStore((state) => state.setFilters);
    const setSorting = usePostgresStore((state) => state.setSorting);

    useEffect(() => {
        fetchSchemas(connection);

        // Fetch query history if in query mode
        if (isQueryMode) {
            fetchQueryHistory(connection);
        }
    }, [connection, isQueryMode, fetchSchemas, fetchQueryHistory]);

    // Watch for changes to selectedSchema and fetch tables when it changes
    useEffect(() => {
        if (selectedSchema) {
            fetchTables(connection);

            // Reset filters and sorting when changing schema
            setFilters([]);
            setSorting([]);
        }
    }, [selectedSchema, connection, fetchTables, setFilters, setSorting]);

    // Reset filters and sorting when changing to query mode
    useEffect(() => {
        if (isQueryMode) {
            setFilters([]);
            setSorting([]);
        }
    }, [isQueryMode, setFilters, setSorting]);

    // Wrapper functions to pass the connection parameter
    const handleSchemaSelect = useCallback(
        (schema: string) => {
            setSelectedSchema(schema);
        },
        [setSelectedSchema],
    );

    const handleTableSelect = useCallback(
        (tableName: string) => {
            // Reset filters and sorting when selecting a new table
            setFilters([]);
            setSorting([]);
            storeHandleTableSelect(connection, tableName);
        },
        [connection, storeHandleTableSelect, setFilters, setSorting],
    );

    const refreshTableData = useCallback(() => {
        storeRefreshTableData(connection);
    }, [connection, storeRefreshTableData]);

    const handlePaginationChange = useCallback((newPagination: { page: number; perPage: number; total: number }) => {
        const currentPagination = pagination;
        setPagination(newPagination);
        
        // If page changed, refresh table data to log the query and update history
        if (newPagination.page !== currentPagination.page || newPagination.perPage !== currentPagination.perPage) {
            setTimeout(() => {
                storeRefreshTableData(connection);
            }, 0);
        }
    }, [pagination, setPagination, connection, storeRefreshTableData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={connection.name} />
            <div className="flex h-[calc(100vh-4rem)]">
                {/* Master Sidebar for both explorer and query modes */}
                <PostgresMasterSidebar
                    connection={connection}
                    loading={loading}
                    selectedSchema={selectedSchema}
                    schemas={schemas}
                    tables={tables}
                    selectedTable={selectedTable}
                    onSchemaSelect={handleSchemaSelect}
                    onTableSelect={handleTableSelect}
                />

                {/* Main content area for exploring the table or query results */}
                <PostgresContent
                    isQueryMode={isQueryMode}
                    queryError={queryError}
                    errorMessage={errorMessage}
                    queryResults={queryResults}
                    queryColumns={queryColumns}
                    selectedTable={selectedTable}
                    loadingTable={loadingTable}
                    columns={columns}
                    tableData={tableData}
                    pagination={pagination}
                    setPagination={handlePaginationChange}
                    connectionId={connection.id}
                    database={connection.database}
                    selectedSchema={selectedSchema}
                    refreshTableData={refreshTableData}
                    connection={connection}
                />
            </div>
        </AppLayout>
    );
};

export default PostgresExplorer;
