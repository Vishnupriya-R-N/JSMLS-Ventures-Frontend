"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { registerUser, sendOtp } from "@/services/auth";
import { isEmail, isIndianMobile, passwordError } from "@/lib/validators";

type Field = "fullName" | "email" | "mobile" | "password" | "confirm" | "terms";
type Errors = Partial<Record<Field, string>>;

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [verifyLink, setVerifyLink] = useState<string | null>(null);

  function validate(): Errors {
    const e: Errors = {};
    if (fullName.trim().length < 3) e.fullName = "Enter your full name.";
    if (!isEmail(email)) e.email = "Enter a valid email address.";
    if (!isIndianMobile(mobile)) e.mobile = "Enter a valid 10-digit mobile number.";
    const pw = passwordError(password);
    if (pw) e.password = pw;
    if (confirm !== password) e.confirm = "Passwords do not match.";
    if (!terms) e.terms = "You must accept the terms and privacy policy.";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (loading) return;

    setMessage(null);
    setVerifyLink(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);

    const res = await registerUser({
      fullName: fullName.trim(),
      email: email.trim(),
      mobile: mobile.replace(/[\s-]/g, ""),
      password,
      acceptedTerms: terms,
    });

    if (!res.ok) {
      setLoading(false);
      setMessage(res.message);
      return;
    }

    // The account exists now. Ask for the first OTP before opening the verification page.
    const link = `/verify-otp?email=${encodeURIComponent(email.trim())}`;
    const otp = await sendOtp(email.trim());
    setLoading(false);

    if (otp.ok) {
      router.push(link);
      return;
    }

    setMessage(`Your account was created, but the verification code could not be sent: ${otp.message}`);
    setVerifyLink(link);
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      <Input
        label="Full name"
        name="fullName"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
      />
      <Input
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Input
        label="Mobile number"
        name="mobile"
        type="tel"
        autoComplete="tel"
        placeholder="10-digit number"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        error={errors.mobile}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint="At least 8 characters with upper case, lower case and a number."
      />
      <Input
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />

      <div className="grid gap-1.5">
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />
          <span>
            I accept the{" "}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="cursor-pointer font-semibold text-navy-600 underline hover:text-navy-700"
            >
              Terms and Privacy Policy
            </button>
            .
          </span>
        </label>
        {errors.terms && <span className="text-sm text-red-600">{errors.terms}</span>}
      </div>

      {message && <Alert tone="error">{message}</Alert>}
      {verifyLink && (
        <Link href={verifyLink} className="text-sm font-semibold text-navy-600 hover:underline">
          Go to the verification page to request a new code →
        </Link>
      )}

      <Button type="submit" block disabled={loading}>
        {loading ? "Please wait…" : "Create account"}
      </Button>

      <Modal open={showTerms} onClose={() => setShowTerms(false)} title="Terms and Privacy Policy">
        <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-yellow-900">
          Sample text for demonstration only. The final Terms and Privacy Policy will be added
          after legal review.
        </p>
        <h3 className="mb-1 font-semibold text-navy-900">1. Demonstration platform</h3>
        <p className="mb-3">
          Victory Club is a demonstration platform. No real money is collected, moved or paid out,
          and nothing shown represents income or any payment entitlement.
        </p>
        <h3 className="mb-1 font-semibold text-navy-900">2. Your information</h3>
        <p className="mb-3">
          We collect only what is necessary: your full name, email address and mobile number. Your
          details are used to create and verify your account.
        </p>
        <h3 className="mb-1 font-semibold text-navy-900">3. Account security</h3>
        <p className="mb-3">
          Keep your password and OTP private. You are responsible for activity on your account.
        </p>
        <h3 className="mb-1 font-semibold text-navy-900">4. Contact</h3>
        <p>Questions about these terms can be sent to the platform administrator.</p>
      </Modal>
    </form>
  );
}