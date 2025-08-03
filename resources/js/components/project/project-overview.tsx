import { ProjectProps } from "@/types";
import { Link, usePage } from "@inertiajs/react";
import { PlusIcon } from "lucide-react";
import CreatePostgresConnection from "../postgres/create-postgres-connection";
import PostgresConnection from "../postgres/postgres-connection";
import { Card, CardDescription } from "../ui/card";

const ProjectOverview = () => {
    const { databaseConnections, project } = usePage<ProjectProps>().props;

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">Postgres Connections</h2>
            <div className="flex flex-col flex-wrap gap-4 md:flex-row">
                {databaseConnections?.map((connection) => (
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
                    projectId={project.id}
                />
            </div>
        </div>
    );
};

export default ProjectOverview;
