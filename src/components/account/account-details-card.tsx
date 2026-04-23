import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Mail } from "lucide-react";
import type { UserProfile } from "@/lib/db/profile";

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (email?.[0] ?? "?").toUpperCase();
}

function formatJoinDate(createdAt: string) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AccountDetailsCard({
  user,
  title = "Account Information",
  description,
}: {
  user: UserProfile;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20 text-2xl">
            {user.image && (
              <AvatarImage src={user.image} alt={user.name ?? "User"} />
            )}
            <AvatarFallback className="text-xl">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <p className="text-xl font-semibold">{user.name ?? user.email}</p>
            {user.name && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border px-3 py-3">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Email
            </p>
            <p className="break-all text-sm font-medium">{user.email}</p>
          </div>
          <div className="rounded-lg border border-border px-3 py-3">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Member Since
            </p>
            <p className="text-sm font-medium">{formatJoinDate(user.createdAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
