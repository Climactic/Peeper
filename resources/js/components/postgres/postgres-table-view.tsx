import TableDataDisplay from "@/components/postgres/postgres-table-data";
import { DatabaseConnection } from "@/types/database";

/**
 * Component for displaying table data in regular table view mode
 */
interface TableViewProps {
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
    schema: string;
    refreshTableData: () => void;
    connection: DatabaseConnection;
}

const TableView = ({
    selectedTable,
    loadingTable,
    columns,
    tableData,
    pagination,
    setPagination,
    connectionId,
    database,
    schema,
    refreshTableData,
    connection,
}: TableViewProps) => {
    if (!selectedTable) {
        return <div className="mt-8 text-center text-gray-500">{schema ? "Select a table to explore" : "Select a schema to see tables"}</div>;
    }

    return (
        <TableDataDisplay
            selectedTable={selectedTable}
            loadingTable={loadingTable}
            columns={columns}
            tableData={tableData}
            pagination={pagination}
            setPagination={setPagination}
            connectionId={connectionId}
            database={database}
            schema={schema}
            onRowAdded={refreshTableData}
            connection={connection}
            refreshTableData={refreshTableData}
            isQueryResult={false}
        />
    );
};

TableView.displayName = "TableView";

export default TableView;
