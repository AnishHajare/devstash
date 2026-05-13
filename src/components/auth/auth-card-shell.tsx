import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCardShellProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
  headerIcon?: ReactNode;
  className?: string;
};

export function AuthCardShell({
  title,
  description,
  children,
  headerIcon,
  className = "w-full max-w-sm",
}: AuthCardShellProps) {
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        {headerIcon}
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AuthWordmark() {
  return (
    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
      DS
    </div>
  );
}
