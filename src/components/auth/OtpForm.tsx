"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { sendOtp, verifyOtp } from "@/services/auth";

const LENGTH = 6;
const RESEND_SECONDS = 60;
const EXPIRY_SECONDS = 300;
const emptyDigits = () => Array<string>(LENGTH).fill("");

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
//checking
export default function OtpForm({ email }: { email: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(emptyDigits());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [expiresIn, setExpiresIn] = useState(EXPIRY_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  // Resend timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Expiry timer
  useEffect(() => {
    if (expiresIn <= 0 || verified) return;
    const t = setTimeout(() => setExpiresIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [expiresIn, verified]);

  // Redirect to login after success
  useEffect(() => {
    if (!verified) return;
    const t = setTimeout(() => router.push("/login"), 1500);
    return () => clearTimeout(t);
  }, [verified, router]);

  const focusAt = (i: number) => inputs.current[i]?.focus();

  function handleChange(i: number, value: string) {
    const clean = value.replace(/\D/g, "");
    setError(null);
    if (!clean) {
      setDigits((d) => d.map((v, k) => (k === i ? "" : v)));
      return;
    }
    const next = [...digits];
    clean
      .slice(0, LENGTH - i)
      .split("")
      .forEach((ch, k) => {
        next[i + k] = ch;
      });
    setDigits(next);
    focusAt(Math.min(i + clean.length, LENGTH - 1));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      setDigits((d) => d.map((v, k) => (k === i - 1 ? "" : v)));
      focusAt(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      e.preventDefault();
      focusAt(i + 1);
    }
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setSuccess(null);

    const code = digits.join("");
    if (code.length === 0) return setError("Enter the 6-digit OTP.");
    if (code.length < LENGTH) return setError("The OTP must be 6 digits.");
    if (expiresIn <= 0) return setError("This OTP has expired. Please request a new one.");

    setLoading(true);
    const res = await verifyOtp(email, code);
    setLoading(false);

    if (res.ok) {
      setSuccess(res.message);
      setVerified(true);
    } else {
      setError(res.message);
      setDigits(emptyDigits());
      focusAt(0);
    }
  }

  async function onResend() {
    if (cooldown > 0 || loading) return;
    setError(null);
    setSuccess(null);
    setDigits(emptyDigits());
    setLoading(true);
    const res = await sendOtp(email);
    setLoading(false);

    if (res.ok) {
      setSuccess(res.message);
      setCooldown(res.resendAfterSeconds);
      setExpiresIn(res.expiresInSeconds);
    } else {
      setError(res.message);
      if (res.retryAfterSeconds) setCooldown(res.retryAfterSeconds);
    }
    focusAt(0);
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit} noValidate>
      <div role="group" aria-label="6-digit OTP" className="flex justify-center gap-2 sm:gap-3">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={digit}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={error ? true : undefined}
            disabled={verified}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={`h-12 w-11 rounded-[10px] border bg-white text-center text-xl font-semibold text-ink focus:border-navy-600 focus:outline-2 focus:outline-offset-1 focus:outline-navy-600 disabled:bg-slate-100 sm:h-14 sm:w-12 ${
              error ? "border-red-600" : "border-line"
            }`}
          />
        ))}
      </div>

      {!verified && (
        <p className="text-center text-sm text-muted">
          {expiresIn > 0 ? `Code expires in ${formatTime(expiresIn)}` : "This OTP has expired. Request a new one."}
        </p>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      {verified ? (
        <Link
          href="/login"
          className="block rounded-[10px] border border-navy-700 bg-navy-700 px-5 py-2.5 text-center font-semibold text-white hover:bg-navy-600"
        >
          Continue to login
        </Link>
      ) : (
        <>
          <Button type="submit" block disabled={loading || expiresIn <= 0}>
            {loading ? "Please wait…" : "Verify"}
          </Button>
          <div className="text-center text-sm text-muted">
            Didn&apos;t get the code?{" "}
            <button
              type="button"
              onClick={onResend}
              disabled={cooldown > 0 || loading}
              className="cursor-pointer font-semibold text-navy-600 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}