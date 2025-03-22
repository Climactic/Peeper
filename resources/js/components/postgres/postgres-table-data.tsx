import TablePagination from "@/components/database/table-pagination";
import If from "@/components/if";
import AddPostgresRow from "@/components/postgres/add-postgres-row";
import PostgresFilters from "@/components/postgres/postgres-filters";
import PostgresSort from "@/components/postgres/postgres-sort";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DatabaseConnection } from "@/types/database";
import { TableRecord } from "@/types/postgres";
import { CodeIcon, KeyIcon, TableIcon } from "lucide-react";
import { useState } from "react";
import DeletePostgresRow from "./delete-postgres-row";
import EditPostgresRow from "./edit-postgres-row";
import PostgresTableRow from "./postgres-table-row";

interface ColumnData {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    is_primary_key?: boolean;
}

interface PaginationState {
    page: number;
    perPage: number;
    total: number;
}

interface TableDataDisplayProps {
    selectedTable: string | null;
    loadingTable: boolean;
    columns: ColumnData[];
    tableData: Record<string, unknown>[];
    pagination: PaginationState;
    setPagination: (pagination: PaginationState) => void;
    connectionId: string;
    database: string;
    schema: string;
    onRowAdded: () => void;
    connection: DatabaseConnection;
    refreshTableData: () => void;
    isQueryResult?: boolean;
}

const TableDataDisplay = ({
    selectedTable,
    loadingTable,
    columns,
    tableData,
    pagination,
    setPagination,
    connectionId,
    database,
    schema,
    onRowAdded,
    connection,
    refreshTableData,
    isQueryResult,
}: TableDataDisplayProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [row, setRow] = useState<TableRecord | null>(null);

    if (!selectedTable) {
        return null;
    }

    if (loadingTable) {
        return (
            <div className="p-2">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pt-2 align-middle">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-1/2" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    const handlePerPageChange = (value: string) => {
        setPagination({
            ...pagination,
            page: 1,
            perPage: parseInt(value),
        });
        refreshTableData();
    };

    const handleRowClick = (row: TableRecord, type: "edit" | "delete") => {
        setRow(row);
        if (type === "edit") {
            setIsEditing(true);
        } else {
            setIsDeleting(true);
        }
    };

    const PrimaryKeyIcon = ({ isPrimaryKey }: { isPrimaryKey: boolean | undefined }) => {
        return isPrimaryKey ? (
            <Tooltip>
                <TooltipTrigger>
                    <KeyIcon className="text-primary size-3 rotate-45" />
                </TooltipTrigger>
                <TooltipContent>Primary Key</TooltipContent>
            </Tooltip>
        ) : null;
    };

    return (
        <div>
            <div className="bg-background sticky top-0 z-10 flex max-w-screen items-center justify-between border-b px-4 py-2 md:w-full">
                <div className="flex items-center gap-2 align-middle text-lg font-bold">
                    <If condition={isQueryResult} fallback={<TableIcon className="h-4 w-4 text-gray-600" />}>
                        <CodeIcon className="h-4 w-4" />
                    </If>
                    <h2 className="truncate text-lg font-bold">{selectedTable}</h2>
                </div>

                <div className="flex items-center gap-2 align-middle">
                    {!isQueryResult && (
                        <>
                            <PostgresFilters columns={columns} connection={connection} />
                            <PostgresSort columns={columns} connection={connection} />
                        </>
                    )}
                    <AddPostgresRow
                        connectionId={connectionId}
                        database={database}
                        schema={schema}
                        table={selectedTable}
                        columns={columns}
                        onSuccess={onRowAdded}
                    />
                </div>
            </div>
            <div className="flex max-w-screen flex-col overflow-x-auto md:w-full">
                {tableData.length > 0 ? (
                    <>
                        <Table className="relative px-4">
                            <TableHeader>
                                <TableRow>
                                    {columns.map((column, index) => (
                                        <TableHead key={index} className="h-10">
                                            <div className="flex items-center gap-1 align-middle">
                                                <PrimaryKeyIcon isPrimaryKey={column.is_primary_key} />
                                                {column.column_name}
                                                <span className="font-mono text-xs text-gray-500">({column.data_type})</span>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableData.map((row, rowIndex) => (
                                    <PostgresTableRow
                                        key={rowIndex}
                                        row={row as TableRecord}
                                        columns={columns}
                                        rowIndex={rowIndex}
                                        onEdit={() => handleRowClick(row as TableRecord, "edit")}
                                        onDelete={() => handleRowClick(row as TableRecord, "delete")}
                                    />
                                ))}
                            </TableBody>
                        </Table>

                        <TablePagination
                            pagination={pagination}
                            handlePerPageChange={handlePerPageChange}
                            setPagination={setPagination}
                            queryMode={isQueryResult || false}
                        />
                    </>
                ) : (
                    <div className="text-center text-gray-500">No data available</div>
                )}
            </div>

            {row && (
                <>
                    <DeletePostgresRow
                        connectionId={connectionId}
                        database={database}
                        schema={schema}
                        table={selectedTable}
                        columns={columns}
                        row={row}
                        onSuccess={refreshTableData}
                        isOpen={isDeleting}
                        setIsOpen={setIsDeleting}
                    />

                    <EditPostgresRow
                        connectionId={connectionId}
                        database={database}
                        schema={schema}
                        table={selectedTable}
                        columns={columns}
                        rowData={row}
                        isOpen={isEditing}
                        setIsOpen={setIsEditing}
                        onSuccess={refreshTableData}
                    />
                </>
            )}
        </div>
    );
};

export default TableDataDisplay;
