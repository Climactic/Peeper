import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import useMediaQuery from "@/hooks/use-media-query";
import * as React from "react";
import If from "../if";

interface ResponsiveDialogProps {
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
}

export function ResponsiveDialog({
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
}: ResponsiveDialogProps) {
    const isDesktop = useMediaQuery(breakpoint);
    const [internalOpen, setInternalOpen] = React.useState(false);

    // Use either controlled or uncontrolled state
    const isOpen = open !== undefined ? open : internalOpen;
    const setIsOpen = onOpenChange || setInternalOpen;

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent className={contentClassName}>
                    <DialogHeader className={className}>
                        <DialogTitle>{title}</DialogTitle>
                        {description && (
                            <DialogDescription>{description}</DialogDescription>
                        )}
                    </DialogHeader>
                    {children}
                    {footer && <DialogFooter>{footer}</DialogFooter>}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <If condition={Boolean(trigger)}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            </If>
            <DrawerContent className={contentClassName}>
                <DrawerHeader className={className}>
                    <DrawerTitle>{title}</DrawerTitle>
                    {description && (
                        <DrawerDescription>{description}</DrawerDescription>
                    )}
                </DrawerHeader>
                <div className="px-4">{children}</div>
                {footer && <DrawerFooter>{footer}</DrawerFooter>}
            </DrawerContent>
        </Drawer>
    );
}
