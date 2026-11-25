import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="grid place-items-center px-5 pt-10">
      <div className="w-full max-w-115 rounded-2xl border border-line bg-white px-6 py-8 shadow-lg shadow-navy-900/10 sm:px-7">
        <ForgotPasswordForm />
        <p className="mt-5 text-center text-[0.95rem] text-muted">
          Remembered your password?{" "}
          <Link href="/login" className="text-navy-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
