import axios from "axios";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ResponsiveDialog } from "../ui/responsive-dialog";

const CreateProjectModal = ({
    trigger,
}: {
    trigger: React.ReactNode;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get("name") as string;

        const response = await axios.post(route("projects.store"), {
            name,
        });

        if (response.status === 201) {
            setIsOpen(false);
            toast.success("Project created successfully");
        } else {
            toast.error("Failed to create project");
        }
    }, []);

    return (
        <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen} trigger={trigger} title="Create Project" description="Create a new project">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input type="text" placeholder="Project Name" name="name" required />
                <Button type="submit">Create</Button>
            </form>
        </ResponsiveDialog>
    );
};

export default CreateProjectModal;
