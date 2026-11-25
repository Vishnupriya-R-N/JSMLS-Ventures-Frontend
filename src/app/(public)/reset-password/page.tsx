import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { verifyPasswordResetToken } from "@/lib/auth";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({ searchParams, }: { searchParams: Promise<{ email?: string }>; }) {
  const { email } = await searchParams;
  const cookieStore = await cookies();
  const resetToken = cookieStore.get("passwordResetToken")?.value;
  const session = resetToken ? verifyPasswordResetToken(resetToken) : null;
  const resolvedEmail = session?.email ?? email;

  return (
    <div className="grid place-items-center px-5 pt-10">
      <div className="w-full max-w-115 rounded-2xl border border-line bg-white px-6 py-8 shadow-lg shadow-navy-900/10 sm:px-7">
        <ResetPasswordForm email={resolvedEmail} hasResetSession={!!session} />
        <p className="mt-5 text-center text-[0.95rem] text-muted">
          <Link href="/login" className="text-navy-600 hover:underline">
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
