import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { usePostgresStore } from "@/contexts/postgres-context";
import { DatabaseConnection } from "@/types/database";
import { Column } from "@/types/postgres";
import { ArrowDownAZ, ArrowUpAZ, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useState } from "react";

interface PostgresSortProps {
    columns: Column[];
    connection: DatabaseConnection;
}

interface SortOption {
    id: string;
    column: string;
    direction: "asc" | "desc";
}

const PostgresSort = ({ columns, connection }: PostgresSortProps) => {
    const rawSorting = usePostgresStore((state) => state.sorting);
    const setRawSorting = usePostgresStore((state) => state.setSorting);
    const refreshTableData = usePostgresStore((state) => state.refreshTableData);

    const [isOpen, setIsOpen] = useState(false);

    const sorting = (rawSorting as SortOption[]) || [];

    const setSorting = (newSorting: SortOption[]) => {
        setRawSorting(newSorting);
    };

    const addSort = () => {
        if (columns.length === 0) return;

        const newSort: SortOption = {
            id: Math.random().toString(36).substring(2, 9),
            column: columns[0].column_name,
            direction: "asc",
        };

        setSorting([...sorting, newSort]);
    };

    const removeSort = (id: string) => {
        setSorting(sorting.filter((sort) => sort.id !== id));
        if (sorting.length === 0) {
            refreshTableData(connection);
        }
    };

    const updateSort = (id: string, field: keyof SortOption, value: string) => {
        setSorting(sorting.map((sort) => (sort.id === id ? { ...sort, [field]: value } : sort)));
    };

    const applySorting = () => {
        refreshTableData(connection);
        setIsOpen(false);
    };

    const clearSorting = () => {
        setSorting([]);
        refreshTableData(connection);
    };

    // Handle direction toggle button click
    const toggleDirection = (id: string) => {
        const sort = sorting.find((s) => s.id === id);
        if (sort) {
            const newDirection = sort.direction === "asc" ? "desc" : "asc";
            updateSort(id, "direction", newDirection);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    {sorting.length > 0 ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
                    <span className="hidden sm:block">
                        {sorting.length > 0 ? (
                            <>
                                Sort
                                <Badge variant="secondary" className="ml-1">
                                    {sorting.length}
                                </Badge>
                            </>
                        ) : (
                            "Sort"
                        )}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="end">
                <div className="p-4 font-medium">Sort Records</div>
                <Separator />

                <div className="space-y-4 p-4">
                    {sorting.length === 0 ? (
                        <div className="text-muted-foreground py-4 text-center text-sm">
                            <p>No sorting applied.</p>
                            <p>Add a sort to organize results.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sorting.map((sort, index) => (
                                <div key={sort.id} className="flex items-center gap-2">
                                    <div className="flex flex-1 items-center gap-2">
                                        <div className="text-muted-foreground flex w-5 items-center justify-center text-xs font-medium">
                                            {index + 1}
                                        </div>
                                        <Select value={sort.column} onValueChange={(value) => updateSort(sort.id, "column", value)}>
                                            <SelectTrigger className="flex-1">
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
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => toggleDirection(sort.id)}
                                            className="h-10 w-10 shrink-0"
                                            aria-label={sort.direction === "asc" ? "Sort ascending" : "Sort descending"}
                                        >
                                            {sort.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSort(sort.id)}
                                        className="h-8 w-8"
                                        aria-label="Remove sort"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button variant="outline" size="sm" className="flex w-full items-center justify-center gap-1" onClick={addSort}>
                        <Plus className="h-3.5 w-3.5" />
                        Add Sort
                    </Button>
                </div>

                <Separator />

                <div className="flex justify-between p-4">
                    <Button variant="ghost" size="sm" onClick={clearSorting} disabled={sorting.length === 0}>
                        Clear All
                    </Button>
                    <Button size="sm" onClick={applySorting} disabled={sorting.length === 0}>
                        Apply Sorting
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default PostgresSort;
