type AuthFormMessageProps = {
  children: string;
  tone?: "error" | "warning";
};

const TONE_CLASSNAME = {
  error: "bg-destructive/10 text-destructive",
  warning: "bg-amber-500/10 text-amber-500",
} as const;

export function AuthFormMessage({
  children,
  tone = "error",
}: AuthFormMessageProps) {
  return (
    <p className={`rounded-md px-3 py-2 text-sm ${TONE_CLASSNAME[tone]}`}>
      {children}
    </p>
  );
}
