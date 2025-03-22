import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { type NavItem } from "@/types";
import { Link, usePage } from "@inertiajs/react";

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    const groupedItems: Record<string, NavItem[]> = {};

    items.forEach((item) => {
        const group = item.group || "General";
        if (!groupedItems[group]) {
            groupedItems[group] = [];
        }
        groupedItems[group].push(item);
    });

    return (
        <>
            {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                <SidebarGroup key={groupName} className="px-2 py-0">
                    <SidebarGroupLabel>{groupName}</SidebarGroupLabel>
                    <SidebarMenu>
                        {groupItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={item.href === page.url}>
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
