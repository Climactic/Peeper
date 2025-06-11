import ErrorDisplay from "@/components/database/error-display";
import SqlErrorDisplay from "@/components/database/sql-error-display";
import QueryResultsDisplay from "@/components/postgres/postgres-query-results";
import TableView from "@/components/postgres/postgres-table-view";
import { cn } from "@/lib/utils";
import { DatabaseConnection } from "@/types/database";

/**
 * Component for the main content area of the explorer
 */
interface PostgresContentProps {
    isQueryMode: boolean;
    queryError: string | null;
    errorMessage: string | null;
    queryResults: Record<string, unknown>[] | null;
    queryColumns: string[];
    selectedTable: string | null;
    loadingTable: boolean;
    columns: Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
    }>;
    tableData: Record<string, unknown>[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
    };
    setPagination: (pagination: { page: number; perPage: number; total: number }) => void;
    connectionId: string;
    database: string;
    selectedSchema: string | null;
    refreshTableData: () => void;
    connection: DatabaseConnection;
}

const PostgresContent = ({
    isQueryMode,
    queryError,
    errorMessage,
    queryResults,
    queryColumns,
    selectedTable,
    loadingTable,
    columns,
    tableData,
    pagination,
    setPagination,
    connectionId,
    database,
    selectedSchema,
    refreshTableData,
    connection,
}: PostgresContentProps) => {
    return (
        <div className={cn("flex-1 overflow-auto")}>
            {/* Display query error or regular error */}
            {queryError ? <SqlErrorDisplay errorMessage={queryError} /> : <ErrorDisplay errorMessage={errorMessage} />}

            {/* Show query results if available and in query mode, otherwise show table view */}
            {isQueryMode && queryResults ? (
                <QueryResultsDisplay
                    queryResults={queryResults}
                    queryColumns={queryColumns}
                    connectionId={connectionId}
                    database={database}
                    schema={selectedSchema || "public"}
                    connection={connection}
                />
            ) : (
                <TableView
                    selectedTable={selectedTable}
                    loadingTable={loadingTable}
                    columns={columns}
                    tableData={tableData}
                    pagination={pagination}
                    setPagination={setPagination}
                    connectionId={connectionId}
                    database={database}
                    schema={selectedSchema || "public"}
                    refreshTableData={refreshTableData}
                    connection={connection}
                />
            )}
        </div>
    );
};

export default PostgresContent;
