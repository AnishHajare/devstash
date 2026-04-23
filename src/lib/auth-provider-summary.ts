export type AuthProviderSummary = {
  id: string;
  label: string;
  connected: boolean;
};

const PROVIDER_LABELS: Record<string, string> = {
  github: "GitHub",
};

export function getAuthProviderSummaries({
  hasPassword,
  linkedProviders,
}: {
  hasPassword: boolean;
  linkedProviders: string[];
}): AuthProviderSummary[] {
  const providers: AuthProviderSummary[] = [
    {
      id: "credentials",
      label: "Email and password",
      connected: hasPassword,
    },
  ];

  for (const provider of linkedProviders) {
    providers.push({
      id: provider,
      label: PROVIDER_LABELS[provider] ?? provider,
      connected: true,
    });
  }

  return providers;
}
