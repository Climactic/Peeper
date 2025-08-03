import CreateProjectModal from "@/components/project/create-project-modal";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem, Project, Workspace } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { PlusIcon } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
    },
];

export default function Dashboard({ projects, workspaces: { current } }: { projects: Project[]; workspaces: { current: Workspace } }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-4 p-4">
                <h2 className="text-2xl font-bold">{current.name} Projects</h2>
                <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                    {projects.map((project) => (
                        <Link href={route("projects.show", { project: project.id })} key={project.id}>
                            <Card className="flex h-40 w-full flex-col items-center justify-center p-4 md:w-72">
                                <CardHeader>
                                    <CardTitle>{project.name}</CardTitle>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}

                    <CreateProjectModal
                        trigger={
                            <Card className="flex h-40 w-full flex-col items-center justify-center p-4 md:w-72">
                                <PlusIcon className="size-8" />
                                <CardDescription>Add Project</CardDescription>
                            </Card>
                        }
                    />
                </div>
            </div>
        </AppLayout>
    );
}
