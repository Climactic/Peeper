import { ResponsiveDrawer } from "@/components/responsive-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Column, TableRecord } from "@/types/postgres";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditRowDrawerProps {
    connectionId: string;
    database: string;
    schema: string;
    table: string;
    columns: Column[];
    rowData: TableRecord;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onSuccess: () => void;
}

const EditPostgresRow = ({ connectionId, database, schema, table, columns, rowData, isOpen, setIsOpen, onSuccess }: EditRowDrawerProps) => {
    const [formData, setFormData] = useState<Record<string, string | null>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [primaryKeyColumns, setPrimaryKeyColumns] = useState<string[]>([]);
    const [whereCondition, setWhereCondition] = useState<Record<string, unknown>>({});

    // Identify primary key columns for WHERE clause
    useEffect(() => {
        const pkColumns = columns
            .filter((col) => col.is_primary_key === true || col.column_name.toLowerCase() === "id")
            .map((col) => col.column_name);

        setPrimaryKeyColumns(pkColumns);

        // Create WHERE condition using primary keys or all columns as fallback
        const condition: Record<string, unknown> = {};
        if (pkColumns.length > 0) {
            pkColumns.forEach((colName) => {
                condition[colName] = rowData[colName];
            });
        } else {
            // If no PK found, use all columns (not ideal but better than nothing)
            columns.forEach((col) => {
                condition[col.column_name] = rowData[col.column_name];
            });
        }

        setWhereCondition(condition);
    }, [columns, rowData]);

    // Initialize form with existing data
    useEffect(() => {
        if (isOpen && rowData) {
            const initialData: Record<string, string | null> = {};
            columns.forEach((column) => {
                const value = rowData[column.column_name];
                initialData[column.column_name] = value === null ? null : String(value);
            });
            setFormData(initialData);
        }
    }, [isOpen, rowData, columns]);

    // Reset form when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        setIsOpen(isOpen);
        if (isOpen) {
            setError(null);
        }
    };

    const handleInputChange = (columnName: string, value: string) => {
        // If value is empty string and column is nullable, set to null
        const newValue = value === "" && columns.find((c) => c.column_name === columnName)?.is_nullable === "YES" ? null : value;

        setFormData((prev) => ({
            ...prev,
            [columnName]: newValue,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use executeQuery endpoint to run an UPDATE SQL query
            const updateColumns = Object.entries(formData)
                .filter(([key]) => !primaryKeyColumns.includes(key)) // Don't update PK columns
                .map(([key, value]) => {
                    const column = columns.find((c) => c.column_name === key);
                    if (value === null) {
                        return `${key} = NULL`;
                    } else if (
                        column?.data_type.includes("int") ||
                        column?.data_type === "numeric" ||
                        column?.data_type === "decimal" ||
                        column?.data_type === "boolean"
                    ) {
                        return `${key} = ${value}`;
                    } else {
                        return `${key} = '${value?.replace(/'/g, "''")}'`; // Escape single quotes
                    }
                })
                .join(", ");

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

            const updateQuery = `UPDATE ${schema}.${table} SET ${updateColumns} WHERE ${whereClause}`;

            // Execute the update query
            await axios.post(route("postgres.query.execute"), {
                connection_id: connectionId,
                database: database,
                query: updateQuery,
            });

            setIsOpen(false);
            onSuccess();
            toast.success("Row updated successfully");
        } catch (err: unknown) {
            console.error("Error updating row:", err);
            const axiosError = err as AxiosError<{ message: string; error: string }>;
            setError(axiosError.response?.data?.error || axiosError.response?.data?.message || "Failed to update row");
        } finally {
            setLoading(false);
        }
    };

    const renderInputField = (column: Column) => {
        const isRequired = column.is_nullable === "NO" && column.column_default === null;
        const placeholder = `${column.data_type}${isRequired ? " (required)" : ""}`;
        const isPrimaryKey = primaryKeyColumns.includes(column.column_name);

        // Check if the data type is date-related
        if (column.data_type.includes("date") || column.data_type.includes("timestamp")) {
            return (
                <Input
                    id={column.column_name}
                    type="datetime-local"
                    value={formData[column.column_name] || ""}
                    onChange={(e) => handleInputChange(column.column_name, e.target.value)}
                    required={isRequired}
                    disabled={isPrimaryKey}
                    className={isPrimaryKey ? "opacity-70" : ""}
                />
            );
        } else if (column.data_type === "time" || column.data_type.includes("time without time zone")) {
            return (
                <Input
                    id={column.column_name}
                    type="time"
                    value={formData[column.column_name] || ""}
                    onChange={(e) => handleInputChange(column.column_name, e.target.value)}
                    required={isRequired}
                    disabled={isPrimaryKey}
                    className={isPrimaryKey ? "opacity-70" : ""}
                />
            );
        } else if (column.data_type === "date") {
            return (
                <Input
                    id={column.column_name}
                    type="date"
                    value={formData[column.column_name] || ""}
                    onChange={(e) => handleInputChange(column.column_name, e.target.value)}
                    required={isRequired}
                    disabled={isPrimaryKey}
                    className={isPrimaryKey ? "opacity-70" : ""}
                />
            );
        } else if (column.data_type.includes("int") || column.data_type === "numeric" || column.data_type === "decimal") {
            return (
                <Input
                    id={column.column_name}
                    type="number"
                    value={formData[column.column_name] || ""}
                    onChange={(e) => handleInputChange(column.column_name, e.target.value)}
                    placeholder={placeholder}
                    required={isRequired}
                    disabled={isPrimaryKey}
                    className={isPrimaryKey ? "opacity-70" : ""}
                />
            );
        } else if (column.data_type === "boolean") {
            return (
                <select
                    id={column.column_name}
                    value={formData[column.column_name] || ""}
                    onChange={(e) => handleInputChange(column.column_name, e.target.value)}
                    className={`border-input bg-background w-full rounded-md border px-3 py-2 ${isPrimaryKey ? "opacity-70" : ""}`}
                    required={isRequired}
                    disabled={isPrimaryKey}
                >
                    <option value="">Select...</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            );
        } else {
            return (
                <Textarea
                    id={column.column_name}
                    value={formData[column.column_name] || ""}
                    onChange={(e) => handleInputChange(column.column_name, e.target.value)}
                    placeholder={placeholder}
                    required={isRequired}
                    disabled={isPrimaryKey}
                    className={isPrimaryKey ? "opacity-70" : ""}
                />
            );
        }
    };

    const dialogFooter = (
        <>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
            </Button>
            <Button type="submit" form="edit-row-form" disabled={loading}>
                {loading ? "Updating..." : "Update Row"}
            </Button>
        </>
    );

    return (
        <ResponsiveDrawer
            open={isOpen}
            onOpenChange={handleOpenChange}
            title={`Edit Row in ${table}`}
            description="Modify values for each column. Primary key fields are disabled."
            footer={dialogFooter}
        >
            <form id="edit-row-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-4 px-1 md:px-4">
                    {columns.map((column) => (
                        <div key={column.column_name} className="flex flex-col gap-2">
                            <Label htmlFor={column.column_name}>
                                {column.column_name}
                                {column.is_nullable === "NO" && <span className="text-red-500">*</span>}
                                {primaryKeyColumns.includes(column.column_name) && <span className="ml-1 text-blue-500">(PK)</span>}
                            </Label>
                            <div className="col-span-2">
                                {renderInputField(column)}
                                <p className="mt-1 text-xs text-gray-500">
                                    {column.data_type}
                                    {column.column_default && ` (default: ${column.column_default})`}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}
            </form>
        </ResponsiveDrawer>
    );
};

export default EditPostgresRow;
