import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border px-4">
        <div className="flex items-center gap-2 w-48 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            DS
          </div>
          <span className="font-semibold text-sm">DevStash</span>
        </div>

        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-8 h-8 bg-muted/50 border-border text-sm"
            />
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-xs text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            New Collection
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Item
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 border-r border-border p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Sidebar</h2>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-sm font-semibold text-muted-foreground">Main</h2>
        </main>
      </div>
    </div>
  );
}
