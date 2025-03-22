import { ResponsiveDrawer } from "@/components/responsive-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Column } from "@/types/postgres";
import axios, { AxiosError } from "axios";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddRowDrawerProps {
    connectionId: string;
    database: string;
    schema: string;
    table: string;
    columns: Column[];
    onSuccess: () => void;
}

const AddPostgresRow = ({ connectionId, database, schema, table, columns, onSuccess }: AddRowDrawerProps) => {
    const [open, setOpen] = useState<boolean>(false);
    const [formData, setFormData] = useState<Record<string, string | null>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Set default values based on column definitions
    const resetForm = () => {
        const defaultFormData: Record<string, string> = {};
        columns.forEach((column) => {
            defaultFormData[column.column_name] = "";
        });
        setFormData(defaultFormData);
    };

    // Reset form when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            resetForm();
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
            // Filter out empty values to let PostgreSQL use default values
            const filteredData = Object.entries(formData).reduce(
                (acc, [key, value]) => {
                    if (value !== "") {
                        acc[key] = value;
                    }
                    return acc;
                },
                {} as Record<string, string | null>,
            );

            await axios.post(route("postgres.insert-row", { connection: connectionId }), {
                database,
                schema,
                table,
                data: filteredData,
            });

            setOpen(false);
            onSuccess();
            toast.success("Row added successfully");
        } catch (err: unknown) {
            console.error("Error adding row:", err);
            const axiosError = err as AxiosError<{ message: string }>;
            setError(axiosError.response?.data?.message || "Failed to add row");
        } finally {
            setLoading(false);
        }
    };

    const renderInputField = (column: Column) => {
        const isRequired = column.is_nullable === "NO" && column.column_default === null;
        const placeholder = `${column.data_type}${isRequired ? " (required)" : ""}`;

        // Check if the data type is date-related
        if (column.data_type.includes("date") || column.data_type.includes("timestamp")) {
            return (
                <Input
                    id={column.column_name}
                    type="datetime-local"
                    value={formData[column.column_name] || ""}
                    onChange={(e) => handleInputChange(column.column_name, e.target.value)}
                    required={isRequired}
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
                />
            );
        } else if (column.data_type === "boolean") {
            return (
                <select
                    id={column.column_name}
                    value={formData[column.column_name] || ""}
                    onChange={(e) => handleInputChange(column.column_name, e.target.value)}
                    className="border-input bg-background w-full rounded-md border px-3 py-2"
                    required={isRequired}
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
                />
            );
        }
    };

    const dialogTrigger = (
        <Button size="sm">
            <PlusIcon className="size-4" />
            <span className="hidden sm:block">Add Row</span>
        </Button>
    );

    const dialogFooter = (
        <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
            </Button>
            <Button type="submit" form="add-row-form" disabled={loading}>
                {loading ? "Adding..." : "Add Row"}
            </Button>
        </>
    );

    return (
        <ResponsiveDrawer
            open={open}
            onOpenChange={handleOpenChange}
            trigger={dialogTrigger}
            title={`Add New Row to ${table}`}
            description="Enter values for each column. Leave blank to use default values."
            footer={dialogFooter}
        >
            <form id="add-row-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-4 px-1 md:px-4">
                    {columns.map((column) => (
                        <div key={column.column_name} className="flex flex-col gap-2">
                            <Label htmlFor={column.column_name}>
                                {column.column_name}
                                {column.is_nullable === "NO" && <span className="text-red-500">*</span>}
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

export default AddPostgresRow;
