import SchemaSelector from "@/components/database/schema-selector";
import TablesList from "@/components/database/tables-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PanelLeftIcon, SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";

interface SchemaData {
    schema_name: string;
}

interface TableData {
    table_schema: string;
    table_name: string;
}

interface PostgresSidebarProps {
    loading: boolean;
    selectedSchema: string | null;
    schemas: SchemaData[];
    tables: TableData[];
    selectedTable: string | null;
    onSchemaSelect: (schema: string) => void;
    onTableSelect: (tableName: string) => void;
}

const PostgresSidebar = ({ loading, selectedSchema, schemas, tables, selectedTable, onSchemaSelect, onTableSelect }: PostgresSidebarProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredTables = tables.filter((table) => {
        const regex = new RegExp(search, "i");
        return regex.test(table.table_name);
    });

    const sidebarContent = (
        <>
            <div className="text-sm font-medium text-gray-500 uppercase">Schema</div>
            <SchemaSelector
                loading={loading}
                selectedSchema={selectedSchema}
                schemas={schemas}
                onSchemaSelect={(schema) => {
                    onSchemaSelect(schema);
                    setOpen(false);
                }}
            />

            {selectedSchema && (
                <>
                    <div className="mt-2 flex items-center justify-between align-middle text-sm font-medium text-gray-500 uppercase">
                        <h3>Tables ({tables.length})</h3>
                    </div>
                    <div className="relative flex items-center gap-2">
                        <SearchIcon className="absolute left-2 h-4 w-4 text-gray-500" />
                        <Input
                            className="px-8"
                            type="search"
                            placeholder="Filter tables"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <Button variant="link" className="absolute right-0 cursor-pointer" onClick={() => setSearch("")}>
                                <XIcon className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <TablesList
                        loading={loading}
                        tables={filteredTables}
                        selectedTable={selectedTable}
                        onTableSelect={(tableName) => {
                            onTableSelect(tableName);
                            setOpen(false);
                        }}
                    />
                </>
            )}
        </>
    );

    return (
        <>
            {/* Mobile view */}
            <div className="md:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="fixed bottom-4 left-4 z-10 opacity-50 transition-all duration-200 hover:opacity-100"
                                >
                                    <PanelLeftIcon className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Open table list</TooltipContent>
                    </Tooltip>
                    <SheetContent side="left" className="w-80 p-4">
                        <div className="flex flex-col gap-4 overflow-y-auto pt-10">{sidebarContent}</div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop view */}
            <div className="hidden h-full md:block">
                <div className="flex h-full w-64 flex-col gap-4 overflow-y-auto border-r p-4">{sidebarContent}</div>
            </div>
        </>
    );
};

export default PostgresSidebar;
