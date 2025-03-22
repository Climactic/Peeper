import { Button } from "@/components/ui/button";
import { Column, TableRecord } from "@/types/postgres";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ResponsiveDialog } from "../ui/responsive-dialog";

interface DeletePostgresRowProps {
    connectionId: string;
    database: string;
    schema: string;
    table: string;
    columns: Column[];
    row: TableRecord;
    onSuccess: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const DeletePostgresRow = ({ connectionId, database, schema, table, columns, row, onSuccess, isOpen, setIsOpen }: DeletePostgresRowProps) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [whereCondition, setWhereCondition] = useState<Record<string, unknown>>({});

    // Identify primary key columns for WHERE clause
    useEffect(() => {
        if (!row) return;

        const pkColumns = columns
            .filter((col) => col.is_primary_key === true || col.column_name.toLowerCase() === "id")
            .map((col) => col.column_name);

        // Create WHERE condition using primary keys or all columns as fallback
        const condition: Record<string, unknown> = {};
        if (pkColumns.length > 0) {
            pkColumns.forEach((colName) => {
                condition[colName] = row[colName];
            });
        } else {
            // If no PK found, use all columns (not ideal but better than nothing)
            columns.forEach((col) => {
                condition[col.column_name] = row[col.column_name];
            });
        }

        setWhereCondition(condition);
    }, [columns, row]);

    const handleOpenChange = (isOpen: boolean) => {
        setIsOpen(isOpen);
        if (isOpen) {
            setError(null);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError(null);

        try {
            // Build WHERE clause
            const whereClause = Object.entries(whereCondition)
                .map(([key, value]) => {
                    if (value === null) {
                        return `${key} IS NULL`;
                    } else {
                        const column = columns.find((c) => c.column_name === key);
                        if (
                            column?.data_type.includes("int") ||
                            column?.data_type === "numeric" ||
                            column?.data_type === "decimal" ||
                            column?.data_type === "boolean"
                        ) {
                            return `${key} = ${value}`;
                        } else {
                            return `${key} = '${String(value).replace(/'/g, "''")}'`; // Escape single quotes
                        }
                    }
                })
                .join(" AND ");

            const deleteQuery = `DELETE FROM ${schema}.${table} WHERE ${whereClause}`;

            // Execute the delete query
            await axios.post(route("postgres.query.execute"), {
                connection_id: connectionId,
                database: database,
                query: deleteQuery,
            });

            setIsOpen(false);
            onSuccess();
            toast.success("Row deleted successfully");
        } catch (err: unknown) {
            console.error("Error deleting row:", err);
            const axiosError = err as AxiosError<{ message: string; error: string }>;
            setError(axiosError.response?.data?.error || axiosError.response?.data?.message || "Failed to delete row");
        } finally {
            setLoading(false);
        }
    };

    const dialogFooter = (
        <>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? "Deleting..." : "Delete Row"}
            </Button>
        </>
    );

    return (
        <ResponsiveDialog
            open={isOpen}
            onOpenChange={handleOpenChange}
            title="Delete Row"
            description="Are you sure you want to delete this row?"
            footer={dialogFooter}
        >
            <div className="space-y-4">
                <p>This action cannot be undone.</p>
                {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}
            </div>
        </ResponsiveDialog>
    );
};

export default DeletePostgresRow;
