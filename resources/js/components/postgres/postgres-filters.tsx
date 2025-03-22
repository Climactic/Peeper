import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePostgresStore } from "@/contexts/postgres-context";
import { DatabaseConnection } from "@/types/database";
import { Column, Filter } from "@/types/postgres";
import { FilterIcon, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface PostgresFiltersProps {
    columns: Column[];
    connection: DatabaseConnection;
}

interface FilterWithId extends Filter {
    id: string;
}

// All available operators
const operatorOptions = [
    { value: "eq", label: "=" },
    { value: "neq", label: "!=" },
    { value: "gt", label: ">" },
    { value: "gte", label: ">=" },
    { value: "lt", label: "<" },
    { value: "lte", label: "<=" },
    { value: "like", label: "LIKE" },
    { value: "ilike", label: "ILIKE" },
    { value: "in", label: "IN" },
    { value: "not_in", label: "NOT IN" },
    { value: "is", label: "IS" },
    { value: "is_not", label: "IS NOT" },
    { value: "is_null", label: "IS NULL" },
    { value: "is_not_null", label: "IS NOT NULL" },
] as const;

// Define data type categories
const numericTypes = [
    "smallint",
    "integer",
    "bigint",
    "decimal",
    "numeric",
    "real",
    "double precision",
    "serial",
    "bigserial",
    "int",
    "int2",
    "int4",
    "int8",
    "float",
    "float4",
    "float8",
];

const booleanTypes = ["boolean", "bool"];

// Get valid operators based on column data type
const getValidOperatorsForType = (dataType: string) => {
    const lowerDataType = dataType.toLowerCase();

    // For numeric types, exclude string comparison operators
    if (numericTypes.includes(lowerDataType)) {
        return operatorOptions.filter((op) => !["like", "ilike"].includes(op.value));
    }

    // For boolean types, prioritize IS operators
    if (booleanTypes.includes(lowerDataType)) {
        // For boolean columns, prioritize IS operators but allow others
        return [
            { value: "is", label: "IS" },
            { value: "is_not", label: "IS NOT" },
            { value: "eq", label: "=" },
            { value: "neq", label: "!=" },
            { value: "is_null", label: "IS NULL" },
            { value: "is_not_null", label: "IS NOT NULL" },
        ];
    }

    // For other types, all operators are valid
    return operatorOptions;
};

// Valid values for IS operator
const isOperatorValues = [
    { value: "TRUE", label: "TRUE" },
    { value: "FALSE", label: "FALSE" },
    { value: "NULL", label: "NULL" },
];

const PostgresFilters = ({ columns, connection }: PostgresFiltersProps) => {
    const rawFilters = usePostgresStore((state) => state.filters);
    const setRawFilters = usePostgresStore((state) => state.setFilters);
    const refreshTableData = usePostgresStore((state) => state.refreshTableData);

    const [isOpen, setIsOpen] = useState(false);

    const filters = rawFilters as FilterWithId[];

    const setFilters = (newFilters: FilterWithId[]) => {
        setRawFilters(newFilters);
    };

    const addFilter = () => {
        if (columns.length === 0) return;

        const newFilter: FilterWithId = {
            id: Math.random().toString(36).substring(2, 9),
            column: columns[0].column_name,
            operator: "eq",
            value: "",
        };

        setFilters([...filters, newFilter]);
    };

    const removeFilter = (id: string) => {
        setFilters(filters.filter((filter) => filter.id !== id));
        if (filters.length === 0) {
            refreshTableData(connection);
        }
    };

    const updateFilter = (id: string, field: keyof Filter, value: string) => {
        const filter = filters.find((f) => f.id === id);

        // If changing column, ensure operator is valid for the new column
        if (field === "column" && filter) {
            const column = columns.find((c) => c.column_name === value);
            if (column) {
                const validOperators = getValidOperatorsForType(column.data_type);
                const isOperatorValid = validOperators.some((op) => op.value === filter.operator);

                // If current operator isn't valid for the new column type, reset to equals
                if (!isOperatorValid) {
                    setFilters(filters.map((f) => (f.id === id ? { ...f, column: value, operator: "eq" } : f)));
                    return;
                }
            }
        }

        // If changing operator to 'is' or 'is_not', set default value for boolean columns
        if (field === "operator" && (value === "is" || value === "is_not")) {
            const filter = filters.find((f) => f.id === id);
            if (filter) {
                const column = columns.find((c) => c.column_name === filter.column);
                if (column && booleanTypes.includes(column.data_type.toLowerCase())) {
                    setFilters(filters.map((f) => (f.id === id ? { ...f, [field]: value, value: "TRUE" } : f)));
                    return;
                } else {
                    setFilters(filters.map((f) => (f.id === id ? { ...f, [field]: value, value: "NULL" } : f)));
                    return;
                }
            }
        }

        setFilters(filters.map((filter) => (filter.id === id ? { ...filter, [field]: value } : filter)));
    };

    const applyFilters = () => {
        refreshTableData(connection);
        setIsOpen(false);
    };

    const clearFilters = () => {
        setFilters([]);
        refreshTableData(connection);
    };

    const needsValueInput = (operator: string) => {
        return !["is_null", "is_not_null"].includes(operator);
    };

    const isDropdownValueInput = (operator: string) => {
        return ["is", "is_not"].includes(operator);
    };

    const isMultilineValueInput = (operator: string) => {
        return ["in", "not_in"].includes(operator);
    };

    // Get the available operators for a specific column
    const getFilterOperators = (columnName: string) => {
        const column = columns.find((c) => c.column_name === columnName);
        if (!column) return operatorOptions;

        return getValidOperatorsForType(column.data_type);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <FilterIcon className="h-4 w-4" />
                    <span className="hidden sm:block">
                        {filters.length > 0 ? (
                            <>
                                Filters
                                <Badge variant="secondary" className="ml-1">
                                    {filters.length}
                                </Badge>
                            </>
                        ) : (
                            "Filters"
                        )}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="end">
                <div className="p-4 font-medium">Filter Records</div>
                <Separator />

                <div className="space-y-4 p-4">
                    {filters.length === 0 ? (
                        <div className="text-muted-foreground py-4 text-center text-sm">
                            <p>No filters applied.</p>
                            <p>Add a filter to narrow down results.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filters.map((filter) => (
                                <div key={filter.id} className="flex items-center gap-2">
                                    <div className="grid flex-1 grid-cols-12 gap-2">
                                        <div className="col-span-4">
                                            <Select value={filter.column} onValueChange={(value) => updateFilter(filter.id, "column", value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {columns.map((column) => (
                                                        <SelectItem key={column.column_name} value={column.column_name}>
                                                            {column.column_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className={needsValueInput(filter.operator) ? "col-span-3" : "col-span-8"}>
                                            <Select value={filter.operator} onValueChange={(value) => updateFilter(filter.id, "operator", value)}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getFilterOperators(filter.column).map((op) => (
                                                        <SelectItem key={op.value} value={op.value}>
                                                            {op.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {needsValueInput(filter.operator) && (
                                            <>
                                                {isDropdownValueInput(filter.operator) && (
                                                    <div className="col-span-5">
                                                        <Select
                                                            value={filter.value}
                                                            onValueChange={(value) => updateFilter(filter.id, "value", value)}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {isOperatorValues.map((val) => (
                                                                    <SelectItem key={val.value} value={val.value}>
                                                                        {val.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                {isMultilineValueInput(filter.operator) && (
                                                    <div className="col-span-5">
                                                        <Textarea
                                                            className="h-20 min-h-[40px]"
                                                            value={filter.value}
                                                            onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                                                            placeholder="Values (comma-separated)"
                                                        />
                                                    </div>
                                                )}

                                                {!isDropdownValueInput(filter.operator) && !isMultilineValueInput(filter.operator) && (
                                                    <Input
                                                        className="col-span-5"
                                                        value={filter.value}
                                                        onChange={(e) => updateFilter(filter.id, "value", e.target.value)}
                                                        placeholder="Value"
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <Button variant="ghost" size="icon" onClick={() => removeFilter(filter.id)} className="h-8 w-8">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button variant="outline" size="sm" className="flex w-full items-center justify-center gap-1" onClick={addFilter}>
                        <Plus className="h-3.5 w-3.5" />
                        Add Filter
                    </Button>
                </div>

                <Separator />

                <div className="flex justify-between p-4">
                    <Button variant="ghost" size="sm" onClick={clearFilters} disabled={filters.length === 0}>
                        Clear All
                    </Button>
                    <Button size="sm" onClick={applyFilters} disabled={filters.length === 0}>
                        Apply Filters
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default PostgresFilters;
