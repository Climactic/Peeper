import { Toaster } from "@/components/ui/sonner";
import AppLayoutTemplate from "@/layouts/app/app-sidebar-layout";
import { type BreadcrumbItem } from "@/types";
import { type ReactNode } from "react";

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
}

export default ({ children, breadcrumbs, actions, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} actions={actions} {...props}>
        <Toaster />
        {children}
    </AppLayoutTemplate>
);
