import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableIcon } from "lucide-react";

interface TableData {
    table_schema: string;
    table_name: string;
}

interface TablesListProps {
    loading: boolean;
    tables: TableData[];
    selectedTable: string | null;
    onTableSelect: (tableName: string) => void;
}

const TablesList = ({ loading, tables, selectedTable, onTableSelect }: TablesListProps) => {
    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
            </div>
        );
    }

    if (tables.length === 0) {
        return <div className="text-sm text-gray-400">No tables available in this schema</div>;
    }

    return (
        <div className="flex flex-col space-y-1">
            {tables.map((table) => (
                <Button
                    key={`${table.table_schema}.${table.table_name}`}
                    variant="ghost"
                    className={`h-auto justify-start py-1 text-sm ${selectedTable === table.table_name ? "bg-muted" : ""}`}
                    onClick={() => onTableSelect(table.table_name)}
                >
                    <TableIcon className="mr-2 h-4 w-4 text-gray-600" />
                    {table.table_name}
                </Button>
            ))}
        </div>
    );
};

export default TablesList;
