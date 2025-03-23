import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { Column, TableRecord } from "@/types/postgres";

interface PostgresTableRowProps {
    row: TableRecord;
    columns: Column[];
    rowIndex: number;
    onEdit: (row: TableRecord) => void;
    onDelete: (row: TableRecord) => void;
}

const PostgresTableRow = ({ row, columns, rowIndex, onEdit, onDelete }: PostgresTableRowProps) => {
    return (
        <ContextMenu>
            <ContextMenuTrigger className="w-full" asChild>
                <TableRow key={rowIndex} className="w-full">
                    {columns.map((column, colIndex) => (
                        <TableCell key={colIndex} className="hover:border-primary/50 h-10 truncate hover:border">
                            {row[column.column_name] !== null ? String(row[column.column_name]) : <span className="text-gray-400">NULL</span>}
                        </TableCell>
                    ))}
                </TableRow>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => onEdit(row)}>Edit</ContextMenuItem>
                <ContextMenuItem className="text-red-500" onClick={() => onDelete(row)}>
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};

export default PostgresTableRow;
