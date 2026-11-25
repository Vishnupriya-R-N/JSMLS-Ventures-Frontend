"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PasswordResetSteps from "@/components/auth/PasswordResetSteps";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { maskEmail, passwordError } from "@/lib/validators";
import { resetPassword } from "@/services/auth";

type Field = "newPassword" | "confirmPassword";
type Errors = Partial<Record<Field, string>>;


export default function ResetPasswordForm({ email, hasResetSession = true, }: { email?: string; hasResetSession?: boolean; }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push("/login"), 1500);
    return () => clearTimeout(t);
  }, [done, router]);

  function validate(): Errors {
    const e: Errors = {};
    if (!newPassword) {
      e.newPassword = "Enter a new password.";
    } else {
      const pw = passwordError(newPassword);
      if (pw) e.newPassword = pw;
    }

    if (!confirmPassword) {
      e.confirmPassword = "Confirm your new password.";
    } else if (confirmPassword !== newPassword) {
      e.confirmPassword = "Passwords do not match.";
    }
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (loading || done) return;

    setError(null);
    setSuccess(null);

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    const res = await resetPassword({ email, newPassword, confirmPassword });
    setLoading(false);

    if (res.ok) {
      setSuccess(res.message);
      setDone(true);
      setNewPassword("");
      setConfirmPassword("");
      return;
    }

    setError(res.message);
  }

  const hasValidEmail = !!email && email.includes("@");

  return (
    <div>
      <PasswordResetSteps current={3} />

      <h1 className="mb-2 text-[1.6rem] font-bold leading-tight text-navy-900">
        Reset password
      </h1>
      <p className="mb-6 text-muted">
        {hasValidEmail ? (
          <>
            Create a new password for <strong>{maskEmail(email)}</strong>.
          </>
        ) : (
          "Create a new password for your account."
        )}
      </p>

      {!hasResetSession && !done && (
        <div className="mb-4">
          <Alert tone="error">
            Your password reset session is missing or has expired.{" "}
            <Link href="/forgot-password" className="font-semibold underline">
              Request a new OTP
            </Link>
            .
          </Alert>
        </div>
      )}

      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <Input
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          disabled={done}
          onChange={(e) => {
            const next = e.target.value;
            setNewPassword(next);
            if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
            if (errors.confirmPassword && next === confirmPassword) {
              setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
            if (error) setError(null);
          }}
          error={errors.newPassword}
          hint="At least 8 characters with upper case, lower case and a number."
        />

        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          disabled={done}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) {
              setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
            if (error) setError(null);
          }}
          error={errors.confirmPassword}
        />

        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        {done ? (
          <Link
            href="/login"
            className="block rounded-[10px] border border-navy-700 bg-navy-700 px-5 py-2.5 text-center font-semibold text-white hover:bg-navy-600"
          >
            Continue to login
          </Link>
        ) : (
          <Button type="submit" block disabled={loading}>
            {loading ? "Resetting password…" : "Reset password"}
          </Button>
        )}
      </form>
    </div>
  );
}
