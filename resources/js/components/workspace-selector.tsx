import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { SharedData } from "@/types";
import { Link } from "@inertiajs/react";
import { CheckIcon, ChevronsUpDown, Users } from "lucide-react";

export function TeamSelector({ workspaces }: { workspaces: SharedData["workspaces"] }) {
    const { state } = useSidebar();

    const hasWorkspaces = workspaces.all.length > 0;
    const currentWorkspace = workspaces.current;

    if (!hasWorkspaces) {
        return null;
    }

    const isCollapsed = state === "collapsed";

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="sm" className="ring-border bg-background rounded-lg ring-1 md:h-8">
                            <div className="flex aspect-square size-4 items-center justify-center rounded-lg">
                                {currentWorkspace?.logo ? (
                                    <img
                                        src={currentWorkspace.logo}
                                        alt={currentWorkspace.name}
                                        className="size-4 rounded-lg border-2 border-white"
                                    />
                                ) : (
                                    <Users className="size-4" />
                                )}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{currentWorkspace?.name || "Select a workspace"}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="max-h-48 w-[--radix-dropdown-menu-trigger-width] min-w-56 overflow-auto rounded-lg"
                        side={isCollapsed ? "right" : "bottom"}
                        align="start"
                        sideOffset={4}
                    >
                        {workspaces.all.map((workspace) => (
                            <DropdownMenuItem key={workspace.id}>
                                <Link
                                    href="?"
                                    data={{ switch_team: workspace.id }}
                                    className="flex w-full items-center justify-between"
                                    preserveScroll
                                >
                                    <span>{workspace.name}</span>
                                    {currentWorkspace?.id === workspace.id && <CheckIcon className="h-4 w-4" />}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
