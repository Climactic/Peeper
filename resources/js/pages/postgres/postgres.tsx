import CreatePostgresConnection from "@/components/postgres/create-postgres-connection";
import PostgresConnection from "@/components/postgres/postgres-connection";
import { Card, CardDescription } from "@/components/ui/card";
import AppLayout from "@/layouts/app-layout";
import { DatabaseConnection } from "@/types/database";
import { Head, Link } from "@inertiajs/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { PlusIcon } from "lucide-react";

dayjs.extend(relativeTime);

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
                        <Link href={route("postgres.explore", { connection: connection.id })} key={connection.id}>
                            <PostgresConnection connection={connection} />
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
