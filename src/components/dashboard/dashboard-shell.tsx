"use client";

import { useState } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar-content";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex shrink-0 flex-col border-r border-border transition-[width] duration-200 ease-in-out ${
          collapsed ? "w-14" : "w-52"
        }`}
      >
        {/* Collapse toggle */}
        <div className={`flex h-10 items-center shrink-0 border-b border-border ${collapsed ? "justify-center" : "justify-between px-3"}`}>
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground">Navigation</span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile drawer toggle — shown in the main area on small screens */}
      <div className="md:hidden absolute top-14 left-2 z-40">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0" showCloseButton>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 pt-8 md:pt-6">
        {children}
      </main>
    </div>
  );
}
