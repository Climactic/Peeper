import If from "@/components/if";
import CreatePostgresConnection from "@/components/postgres/create-postgres-connection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/layouts/app-layout";
import { DatabaseConnection } from "@/types/database";
import { Head, Link } from "@inertiajs/react";
import { CogIcon, DatabaseIcon, PlusIcon, ServerIcon } from "lucide-react";
import { SiPostgresql } from "react-icons/si";

interface PostgresProps {
    connections: DatabaseConnection[];
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
                                    <CardTitle className="flex items-center gap-2 align-middle">
                                        <SiPostgresql className="size-4" />
                                        {connection.name}
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
