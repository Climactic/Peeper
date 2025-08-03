import ProjectOverview from "@/components/project/project-overview";
import AppLayout from "@/layouts/app-layout";
import { ProjectProps } from "@/types/index";
import { Head } from "@inertiajs/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const Project = ({ project }: ProjectProps) => {
    return (
        <AppLayout
            breadcrumbs={[
                { title: "Projects", href: route("dashboard") },
                { title: project.name, href: route("projects.show", { project: project.id }) },
            ]}
        >
            <Head title={project.name} />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-4">
                    <ProjectOverview />
                </div>
            </div>
        </AppLayout>
    );
};

export default Project;
