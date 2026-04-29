"use client";

import { MonitorSmartphone, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
      <div className="min-w-0 space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          Theme
        </p>
        <p className="text-sm text-muted-foreground">
          {theme === "dark" ? "Dark mode is active." : "Light mode is active."}
        </p>
      </div>
      <div
        className="flex items-center rounded-lg border border-border bg-muted/30 p-1"
        role="group"
        aria-label="Theme"
      >
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            theme === "light" && "bg-primary text-primary-foreground shadow-sm"
          )}
          aria-label="Use light mode"
          aria-pressed={theme === "light"}
          onClick={() => setTheme("light")}
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            theme === "dark" && "bg-primary text-primary-foreground shadow-sm"
          )}
          aria-label="Use dark mode"
          aria-pressed={theme === "dark"}
          onClick={() => setTheme("dark")}
        >
          <Moon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
