import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLinkedAccounts } from "@/lib/db/accounts";
import { getUserProfile } from "@/lib/db/profile";
import { AccountDetailsCard } from "@/components/account/account-details-card";
import { ChangePasswordSection } from "@/components/account/change-password-section";
import { DeleteAccountSection } from "@/components/account/delete-account-section";
import { EditorPreferencesSection } from "@/components/account/editor-preferences-section";
import { LinkedAccountsSection } from "@/components/account/linked-accounts-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [{ user }, linkedAccounts] = await Promise.all([
    getUserProfile(session.user.id),
    getLinkedAccounts(session.user.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your long-term home for account access, security, and future
          preferences.
        </p>
      </div>

      <Separator />

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The core identity details tied to your DevStash account.
          </p>
        </div>
        <AccountDetailsCard
          user={user}
          title="Profile Details"
          description="Read-only identity details used across your workspace."
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Access
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Control how you sign in today and prepare for more preferences later.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign-in Methods</CardTitle>
            <CardDescription>
              Review which login methods are active and connect providers
              without leaving this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedAccountsSection
              linkedProviders={linkedAccounts.map((account) => account.provider)}
              hasPassword={user.hasPassword}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Editor
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tune Monaco to match how you read and edit code.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Code Editor</CardTitle>
            <CardDescription>
              Choose your defaults once and apply them anywhere Monaco appears.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditorPreferencesSection />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Security
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Protect access to your account with a current password and a fresh
            replacement when needed.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Update the password used for email sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.hasPassword ? (
              <ChangePasswordSection />
            ) : (
              <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Password changes are available after you add email sign-in to
                this account.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            High-impact actions that permanently change or remove your account.
          </p>
        </div>
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle>Delete Account</CardTitle>
            <CardDescription>
              Permanently remove your account and all saved data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountSection />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
