import { AppContent } from "@/components/app-content";
import { AppShell } from "@/components/app-shell";
import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarHeader } from "@/components/app-sidebar-header";
import { type BreadcrumbItem } from "@/types";
import { type PropsWithChildren, type ReactNode } from "react";

interface AppSidebarLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
}

export default function AppSidebarLayout({ children, breadcrumbs = [], actions }: PropsWithChildren<AppSidebarLayoutProps>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} actions={actions} />
                <div className="mx-auto flex w-full flex-1 flex-col">{children}</div>
            </AppContent>
        </AppShell>
    );
}
