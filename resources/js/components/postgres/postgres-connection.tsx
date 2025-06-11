import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DatabaseConnection } from "@/types/database";
import { ConnectionStatus } from "@/types/postgres";
import axios from "axios";
import dayjs from "dayjs";
import { Circle, CogIcon, DatabaseIcon, ServerIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SiPostgresql } from "react-icons/si";
import If from "../if";

const PostgresConnection = ({ connection }: { connection: DatabaseConnection }) => {
    const [status, setStatus] = useState<ConnectionStatus | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            const response = await axios.get(route("postgres.connection-status", { id: connection.id }));
            setStatus(response.data);
        };
        fetchStatus();
    }, [connection.id]);

    return (
        <Card className="h-40 w-full md:w-72">
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 align-middle">
                    <div className="flex items-center gap-2">
                        <SiPostgresql className="size-4" />
                        {connection.name}
                    </div>
                    <div className="flex items-center gap-2">
                        <If condition={status === null}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Circle className="size-3 animate-pulse fill-gray-400 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-sm">Loading...</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </If>
                        <If condition={status !== null && status?.connection_status}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Circle className="size-3 animate-pulse fill-green-500 text-green-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-sm">Online</p>
                                        <p className="text-muted-foreground text-xs">{dayjs(status?.last_tested).fromNow()}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </If>
                        <If condition={status !== null && !status?.connection_status}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Circle className="size-3 animate-pulse fill-red-500 text-red-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-sm">Offline</p>
                                        <p className="text-muted-foreground text-xs">{status?.connection_error}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </If>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <ServerIcon className="size-4" />
                    {connection.host}:{connection.port}
                </p>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <DatabaseIcon className="size-4" />
                    {connection.database}
                </p>
                <If condition={connection.metadata?.server.server_version}>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <CogIcon className="size-4" />
                        {connection.metadata?.server.server_version}
                    </p>
                </If>
            </CardContent>
        </Card>
    );
};

export default PostgresConnection;
