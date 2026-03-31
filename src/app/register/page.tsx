import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Register — DevStash",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <RegisterForm />
    </div>
  );
}
