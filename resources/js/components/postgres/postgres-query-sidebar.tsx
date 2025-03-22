import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePostgresStore } from "@/contexts/postgres-context";
import { useAppearance } from "@/hooks/use-appearance";
import { DatabaseConnection } from "@/types/database";
import Editor from "@monaco-editor/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ClockIcon, CodeIcon, GripHorizontalIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

dayjs.extend(relativeTime);

interface PostgresQuerySidebarProps {
    connection: DatabaseConnection;
}

interface QueryHistoryItem {
    id: number;
    database_connection_id: number;
    query: string;
    executor: string;
    executor_id: number | null;
    type: string;
    description: string;
    created_at: string;
    updated_at: string;
}

const PostgresQuerySidebar = ({ connection }: PostgresQuerySidebarProps) => {
    const isQueryMode = usePostgresStore((state) => state.isQueryMode);
    const queryString = usePostgresStore((state) => state.queryString);
    const queryHistory = usePostgresStore((state) => state.queryHistory) as QueryHistoryItem[];
    const executingQuery = usePostgresStore((state) => state.executingQuery);
    const loadingHistory = usePostgresStore((state) => state.loadingHistory);
    const setQueryString = usePostgresStore((state) => state.setQueryString);
    const executeQuery = usePostgresStore((state) => state.executeQuery);

    const [tab, setTab] = useState("editor");
    const [editorHeight, setEditorHeight] = useState(200);
    const resizeRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const { appearance } = useAppearance();

    const setHistoryItemAsQuery = useCallback(
        (item: QueryHistoryItem) => {
            setQueryString(item.query);
            setTab("editor");
        },
        [setQueryString],
    );

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingRef.current) {
                const editorContainer = resizeRef.current?.previousElementSibling;
                if (editorContainer) {
                    const containerRect = editorContainer.getBoundingClientRect();
                    const newHeight = Math.max(100, e.clientY - containerRect.top);
                    setEditorHeight(newHeight);
                }
            }
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }, []);

    if (!isQueryMode) {
        return null;
    }

    const sidebarContent = (
        <div className="flex h-full flex-col justify-between gap-4">
            <Tabs onValueChange={setTab} value={tab} defaultValue="editor" className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                    <TabsTrigger value="editor" className="flex items-center gap-2">
                        <CodeIcon className="h-4 w-4" />
                        <span>Editor</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>History</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="flex flex-col gap-2">
                    <div
                        className="rounded-md border p-1 font-mono text-sm"
                        style={{ height: `${editorHeight}px` }}
                        onKeyDown={(e) => {
                            if (e.ctrlKey && e.code === "Enter" && queryString?.trim()) {
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

                    <div
                        ref={resizeRef}
                        className="group relative h-0.5 w-full cursor-ns-resize transition-colors"
                        onMouseDown={handleResizeMouseDown}
                    >
                        <div className="absolute inset-y-0 right-0 left-0 bg-gray-100 transition-colors group-hover:bg-gray-200 dark:bg-gray-800 dark:group-hover:bg-gray-700" />
                        <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                            <GripHorizontalIcon className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400" />
                        </div>
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
                </TabsContent>

                <TabsContent value="history" className="h-full">
                    {loadingHistory ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : queryHistory.length > 0 ? (
                        <ScrollArea className="h-full">
                            <div className="space-y-2">
                                {queryHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setHistoryItemAsQuery(item)}
                                        className="hover:bg-primary/10 cursor-pointer rounded-md border p-3 transition-colors"
                                    >
                                        <div className="mb-1 flex items-center justify-between">
                                            <div className="text-xs font-medium text-gray-500">{dayjs(item.created_at).fromNow()}</div>
                                            <div className="text-xs text-gray-500">{item.executor === "user" ? "You" : "System"}</div>
                                        </div>
                                        <div className="overflow-hidden font-mono text-sm text-wrap text-ellipsis whitespace-normal">
                                            {item.query.slice(0, 100) + (item.query.length > 100 ? "..." : "")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="py-8 text-center text-gray-500">No query history found</div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );

    return (
        <>
            {/* Mobile view */}
            <div className="md:hidden">
                <Sheet>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="fixed bottom-4 left-4 z-10 opacity-50 transition-all duration-200 hover:opacity-100"
                                >
                                    <CodeIcon className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Open query editor</TooltipContent>
                    </Tooltip>
                    <SheetContent side="left" className="p-4">
                        <div className="flex flex-col gap-4 overflow-y-auto pt-10">{sidebarContent}</div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop view */}
            <div className="hidden h-full w-full max-w-[350px] min-w-[300px] md:block">
                <div className="flex h-full w-full flex-col gap-4 overflow-y-auto border-l p-4">{sidebarContent}</div>
            </div>
        </>
    );
};

export default PostgresQuerySidebar;
