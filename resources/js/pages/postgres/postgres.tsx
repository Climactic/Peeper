import If from "@/components/if";
import CreatePostgresConnection from "@/components/postgres/create-postgres-connection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AppLayout from "@/layouts/app-layout";
import { DatabaseConnection } from "@/types/database";
import { Head, Link } from "@inertiajs/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Circle, CogIcon, DatabaseIcon, PlusIcon, ServerIcon } from "lucide-react";
import { SiPostgresql } from "react-icons/si";

dayjs.extend(relativeTime);

interface PostgresProps {
    connections: (DatabaseConnection & { connection_status: boolean; connection_error: string | null; last_tested: string })[];
}

const Postgres = ({ connections }: PostgresProps) => {
    return (
        <AppLayout breadcrumbs={[{ title: "Postgres", href: route("postgres.index") }]}>
            <Head title="Postgres" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col flex-wrap gap-4 md:flex-row">
                    {connections.map((connection) => (
                        <Link href={route("postgres.explore", { ulid: connection.ulid })} key={connection.ulid}>
                            <Card className="h-40 w-full md:w-72">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between gap-2 align-middle">
                                        <div className="flex items-center gap-2">
                                            <SiPostgresql className="size-4" />
                                            {connection.name}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <If condition={connection.connection_status}>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Circle className="size-3 animate-pulse fill-green-500 text-green-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-sm">Online</p>
                                                            <p className="text-muted-foreground text-xs">{dayjs(connection.last_tested).fromNow()}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </If>
                                            <If condition={!connection.connection_status}>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Circle className="size-3 animate-pulse fill-red-500 text-red-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-sm">Offline</p>
                                                            <p className="text-muted-foreground text-xs">{connection.connection_error}</p>
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
                        </Link>
                    ))}
                    <CreatePostgresConnection
                        trigger={
                            <Card className="flex h-40 w-full flex-col items-center justify-center p-4 md:w-72">
                                <PlusIcon className="size-8" />
                                <CardDescription>Add Connection</CardDescription>
                            </Card>
                        }
                    />
                </div>
            </div>
        </AppLayout>
    );
};

export default Postgres;
