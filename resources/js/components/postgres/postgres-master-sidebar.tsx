import SchemaSelector from "@/components/database/schema-selector";
import TablesList from "@/components/database/tables-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePostgresStore } from "@/contexts/postgres-context";
import { useAppearance } from "@/hooks/use-appearance";
import { DatabaseConnection } from "@/types/database";
import { QueryHistoryItem } from "@/types/postgres";
import Editor from "@monaco-editor/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CodeIcon, DatabaseIcon, PanelLeftIcon, PlayIcon, RotateCcwIcon, SearchIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Separator } from "../ui/separator";

dayjs.extend(relativeTime);

interface SchemaData {
    schema_name: string;
}

interface TableData {
    table_schema: string;
    table_name: string;
}

interface PostgresMasterSidebarProps {
    connection: DatabaseConnection;
    loading: boolean;
    selectedSchema: string | null;
    schemas: SchemaData[];
    tables: TableData[];
    selectedTable: string | null;
    onSchemaSelect: (schema: string) => void;
    onTableSelect: (tableName: string) => void;
}

const PostgresMasterSidebar = ({
    connection,
    loading,
    selectedSchema,
    schemas,
    tables,
    selectedTable,
    onSchemaSelect,
    onTableSelect,
}: PostgresMasterSidebarProps) => {
    const isQueryMode = usePostgresStore((state) => state.isQueryMode);
    const queryString = usePostgresStore((state) => state.queryString);
    const queryHistory = usePostgresStore((state) => state.queryHistory);
    const executingQuery = usePostgresStore((state) => state.executingQuery);
    const loadingHistory = usePostgresStore((state) => state.loadingHistory);
    const setQueryString = usePostgresStore((state) => state.setQueryString);
    const executeQuery = usePostgresStore((state) => state.executeQuery);
    const setQueryMode = usePostgresStore((state) => state.setQueryMode);

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("explorer");

    const { appearance } = useAppearance();

    // Auto-switch to query tab when query mode is enabled
    useEffect(() => {
        if (isQueryMode) {
            setActiveTab("query");
        }
    }, [isQueryMode]);

    // Handle tab changes and auto-enable query mode
    const handleTabChange = useCallback(
        (tab: string) => {
            setActiveTab(tab);
            if (tab === "query" && !isQueryMode) {
                setQueryMode(true);
            }
        },
        [isQueryMode, setQueryMode],
    );

    const filteredTables = tables.filter((table) => {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedSearch, "i");
        return regex.test(table.table_name);
    });

    const setHistoryItemAsQuery = useCallback(
        (item: QueryHistoryItem) => {
            setQueryString(item.query);
        },
        [setQueryString],
    );

    // Explorer content
    const explorerContent = (
        <div className="flex flex-col gap-4">
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
                        <p>Tables ({tables.length})</p>
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
        </div>
    );

    // Query content
    const queryContent = (
        <div className="flex max-h-[80vh] flex-col gap-4">
            {/* SQL Editor Section */}
            <div className="flex flex-col gap-3 rounded-lg bg-card" style={{ height: "50%" }}>
                <p className="text-sm font-medium text-gray-500 uppercase">SQL Editor</p>
                <div
                    className="rounded-md border bg-background p-2 font-mono text-sm flex-1 min-h-0"
                    onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.code === "Enter" && queryString?.trim()) {
                            executeQuery(connection);
                        }
                    }}
                >
                    <Editor
                        className="h-full"
                        height={"100%"}
                        value={queryString || ""}
                        theme={appearance === "dark" ? "vs-dark" : "vs"}
                        onChange={(value) => setQueryString(value || "")}
                        options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 12,
                            automaticLayout: true,
                            wordWrap: "on",
                            contextmenu: false,
                            suggestOnTriggerCharacters: true,
                            fixedOverflowWidgets: true,
                        }}
                        language="sql"
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => executeQuery(connection)} disabled={executingQuery || !queryString?.trim()} className="flex-1 gap-2">
                        {executingQuery ? (
                            <>
                                <RotateCcwIcon className="h-4 w-4 animate-spin" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <PlayIcon className="h-4 w-4" />
                                Run Query
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Query History Section */}
            <div className="flex flex-col gap-3 rounded-lg bg-card" style={{ height: "50%" }}>
                <p className="text-sm font-medium text-gray-500 uppercase">Query History</p>
                <div className="flex-1 min-h-0">
                    {loadingHistory ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : queryHistory.length > 0 ? (
                        <ScrollArea className="h-full">
                            <div className="space-y-2 pr-2">
                                {queryHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setHistoryItemAsQuery(item)}
                                        className="hover:bg-accent cursor-pointer rounded-md border border-border p-3 transition-colors bg-background"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="text-xs font-medium text-muted-foreground">{dayjs(item.created_at).fromNow()}</div>
                                            <div className="text-xs text-muted-foreground">{item.executor === "user" ? "User" : "System"}</div>
                                        </div>
                                        <div className="overflow-hidden font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                            {item.query.slice(0, 150) + (item.query.length > 150 ? "..." : "")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm">
                            No query history found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Main sidebar content with tabs
    const sidebarContent = (
        <div className="flex h-full max-h-full flex-col gap-4">
            <Tabs onValueChange={handleTabChange} value={activeTab} defaultValue="explorer" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-2">
                    <TabsTrigger value="explorer" className="flex items-center gap-2">
                        <DatabaseIcon className="h-4 w-4" />
                        <span>Explorer</span>
                    </TabsTrigger>
                    <TabsTrigger value="query" className="flex items-center gap-2">
                        <CodeIcon className="h-4 w-4" />
                        <span>Query</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="explorer" className="flex-1 overflow-y-auto">
                    {explorerContent}
                </TabsContent>

                <TabsContent value="query" className="flex-1 flex flex-col">
                    {queryContent}
                </TabsContent>
            </Tabs>
        </div>
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
                        <TooltipContent>Open sidebar</TooltipContent>
                    </Tooltip>
                    <SheetContent side="left" className="w-80 p-4">
                        <div className="flex flex-col gap-4 overflow-y-auto pt-10 h-full">{sidebarContent}</div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop view */}
            <div className="hidden h-full md:block">
                <div className="flex h-full w-76 flex-col gap-4 overflow-y-auto border-r p-4">{sidebarContent}</div>
            </div>
        </>
    );
};

export default PostgresMasterSidebar;
