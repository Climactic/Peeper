import TableDataDisplay from "@/components/postgres/postgres-table-data";
import { DatabaseConnection } from "@/types/database";
import { useMemo } from "react";

/**
 * Component for displaying SQL query results
 */
interface QueryResultsDisplayProps {
    queryResults: Record<string, unknown>[] | null;
    queryColumns: string[];
    connectionId: string;
    database: string;
    schema: string;
    connection: DatabaseConnection;
}

const QueryResultsDisplay = ({ queryResults, queryColumns, connectionId, database, schema, connection }: QueryResultsDisplayProps) => {
    // Create custom column format for query results
    const formattedQueryColumns = useMemo(() => {
        return queryColumns.map((col) => ({
            column_name: col,
            data_type: "text",
            is_nullable: "YES",
            column_default: null,
        }));
    }, [queryColumns]);

    if (!queryResults) {
        return <div className="mt-8 text-center text-gray-500">Use the query editor to run SQL queries</div>;
    }

    return (
        <TableDataDisplay
            selectedTable="Query Results"
            loadingTable={false}
            columns={formattedQueryColumns}
            tableData={queryResults}
            pagination={{
                page: 1,
                perPage: queryResults.length,
                total: queryResults.length,
            }}
            setPagination={() => {
                // No pagination for query results
            }}
            connectionId={connectionId}
            database={database}
            schema={schema}
            onRowAdded={() => {
                // No row adding in query mode
            }}
            connection={connection}
            refreshTableData={() => {
                // No refresh in query mode
            }}
            isQueryResult={true}
        />
    );
};

export default QueryResultsDisplay;
