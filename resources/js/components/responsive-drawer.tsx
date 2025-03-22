import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import useMediaQuery from "@/hooks/use-media-query";
import * as React from "react";
import { ScrollArea } from "./ui/scroll-area";
interface ResponsiveDrawerProps {
    children: React.ReactNode;
    trigger?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
    contentClassName?: string;
    breakpoint?: string;
    side?: "right" | "left" | "top" | "bottom";
}

export function ResponsiveDrawer({
    children,
    trigger,
    title,
    description,
    footer,
    open,
    onOpenChange,
    className,
    contentClassName,
    breakpoint = "(min-width: 768px)",
    side = "right",
}: ResponsiveDrawerProps) {
    const isDesktop = useMediaQuery(breakpoint);
    const [internalOpen, setInternalOpen] = React.useState(false);

    // Use either controlled or uncontrolled state
    const isOpen = open !== undefined ? open : internalOpen;
    const setIsOpen = onOpenChange || setInternalOpen;

    if (isDesktop) {
        return (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>{trigger}</SheetTrigger>
                <SheetContent side={side} className={contentClassName}>
                    <SheetHeader className={className}>
                        <SheetTitle>{title}</SheetTitle>
                        {description && <SheetDescription>{description}</SheetDescription>}
                    </SheetHeader>
                    <ScrollArea className="flex-1 overflow-auto pr-4" style={{ maxHeight: "calc(100vh - 10rem)" }}>
                        {children}
                    </ScrollArea>
                    {footer && <SheetFooter>{footer}</SheetFooter>}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent className={contentClassName}>
                <DrawerHeader className={className}>
                    <DrawerTitle>{title}</DrawerTitle>
                    {description && <DrawerDescription>{description}</DrawerDescription>}
                </DrawerHeader>
                <div className="px-4">{children}</div>
                {footer && <DrawerFooter>{footer}</DrawerFooter>}
            </DrawerContent>
        </Drawer>
    );
}
