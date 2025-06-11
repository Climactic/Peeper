import { NavFooter } from "@/components/nav-footer";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { type NavItem, SharedData } from "@/types";
import { Link, usePage } from "@inertiajs/react";
import { BookOpen, Folder, HeartIcon, LayoutGrid, Settings } from "lucide-react";
import { SiPostgresql } from "react-icons/si";
import AppLogo from "./app-logo";
import If from "./if";
import { TeamSelector } from "./workspace-selector";

const mainNavItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutGrid,
    },
    // {
    //     title: "Settings",
    //     href: "/settings/workspace",
    //     icon: Settings,
    // },
    {
        title: "Postgres",
        href: "/postgres",
        icon: SiPostgresql,
        group: "Database",
    },
];

const footerNavItems: NavItem[] = [
    {
        title: "Support Peeper",
        href: "https://github.com/sponsors/Climactic",
        icon: HeartIcon,
    },
    {
        title: "Repository",
        href: "https://github.com/Climactic/Peeper",
        icon: Folder,
    },
    {
        title: "Documentation",
        href: "https://peeper.dev/docs",
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { workspaces } = usePage<SharedData>().props;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <If condition={workspaces.enabled}>
                    <TeamSelector workspaces={workspaces} />
                </If>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
