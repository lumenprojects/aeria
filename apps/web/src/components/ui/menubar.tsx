import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { cn } from "@/lib/utils";

const Menubar = MenubarPrimitive.Root;
const MenubarMenu = MenubarPrimitive.Menu;
const MenubarTrigger = MenubarPrimitive.Trigger;
const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Content
    ref={ref}
    className={cn("z-50 min-w-[12rem] rounded-md border border-border bg-surface menubar-content-shell", className)}
    {...props}
  />
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn("role-ui cursor-pointer rounded-md menubar-item-shell outline-none focus:bg-surface", className)}
    {...props}
  />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem };
