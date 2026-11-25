"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PasswordResetSteps from "@/components/auth/PasswordResetSteps";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { isEmail, maskEmail } from "@/lib/validators";
import { sendPasswordResetOtp, verifyPasswordResetOtp } from "@/services/auth";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const EXPIRY_SECONDS = 300;
const emptyDigits = () => Array<string>(OTP_LENGTH).fill("");

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;


export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();

  const [digits, setDigits] = useState<string[]>(emptyDigits());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notVerified, setNotVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(EXPIRY_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (i: number) => inputs.current[i]?.focus();

  useEffect(() => {
    if (step === "otp") {
      inputs.current[0]?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (step !== "otp" || cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, cooldown]);

  useEffect(() => {
    if (step !== "otp" || expiresIn <= 0 || verified) return;
    const t = setTimeout(() => setExpiresIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, expiresIn, verified]);

  const resetUrl = `/reset-password?email=${encodeURIComponent(email.trim())}`;

  useEffect(() => {
    if (!verified) return;
    const t = setTimeout(() => router.push(resetUrl), 1200);
    return () => clearTimeout(t);
  }, [verified, router, resetUrl]);

  async function handleSendOtp(ev: React.FormEvent) {
    ev.preventDefault();
    if (loading) return;

    setError(null);
    setSuccess(null);
    setNotVerified(false);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Enter your email address.");
      return;
    }
    if (!isEmail(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError(undefined);
    setLoading(true);
    const res = await sendPasswordResetOtp(trimmed);
    setLoading(false);

    if (!res.ok) {
      setError(res.message);
      setNotVerified(!!res.notVerified);
      return;
    }

    setDigits(emptyDigits());
    setVerified(false);
    setCooldown(res.resendAfterSeconds);
    setExpiresIn(res.expiresInSeconds);
    setSuccess(`A 6-digit verification code has been sent to ${maskEmail(trimmed)}.`);
    setStep("otp");
  }

  function applyPastedOtp(raw: string) {
    const clean = raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!clean) return;
    const next = emptyDigits();
    clean.split("").forEach((ch, idx) => {
      next[idx] = ch;
    });
    setDigits(next);
    focusAt(Math.min(clean.length, OTP_LENGTH - 1));
  }

  function handleDigitPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    setError(null);
    applyPastedOtp(e.clipboardData.getData("text"));
  }

  function handleDigitChange(i: number, value: string) {
    const clean = value.replace(/\D/g, "");
    setError(null);
    if (!clean) {
      setDigits((d) => d.map((v, k) => (k === i ? "" : v)));
      return;
    }

    if (clean.length >= OTP_LENGTH) {
      applyPastedOtp(clean);
      return;
    }

    if (clean.length === 2 && digits[i]) {
      const typed = clean[0] === digits[i] ? clean[1] : clean[0];
      const next = [...digits];
      next[i] = typed;
      setDigits(next);
      focusAt(Math.min(i + 1, OTP_LENGTH - 1));
      return;
    }

    const next = [...digits];
    clean
      .slice(0, OTP_LENGTH - i)
      .split("")
      .forEach((ch, k) => {
        next[i + k] = ch;
      });
    setDigits(next);
    focusAt(Math.min(i + clean.length, OTP_LENGTH - 1));
  }

  function handleDigitKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      setDigits((d) => d.map((v, k) => (k === i - 1 ? "" : v)));
      focusAt(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      e.preventDefault();
      focusAt(i + 1);
    }
  }

  async function handleVerifyOtp(ev: React.FormEvent) {
    ev.preventDefault();
    if (loading || verified) return;

    setError(null);
    setSuccess(null);

    const code = digits.join("");
    if (code.length === 0) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    if (code.length < OTP_LENGTH) {
      setError("The OTP must be 6 digits.");
      return;
    }
    if (expiresIn <= 0) {
      setError("This OTP has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    const res = await verifyPasswordResetOtp(email.trim(), code);
    setLoading(false);

    if (res.ok) {
      setSuccess(res.message);
      setVerified(true);
      return;
    }

    setError(res.message);
    setDigits(emptyDigits());
    focusAt(0);
  }

  async function handleResendOtp() {
    if (cooldown > 0 || loading) return;
    setError(null);
    setSuccess(null);
    setDigits(emptyDigits());
    setLoading(true);
    const res = await sendPasswordResetOtp(email.trim());
    setLoading(false);

    if (res.ok) {
      setSuccess(`A new 6-digit verification code has been sent to ${maskEmail(email.trim())}.`);
      setCooldown(res.resendAfterSeconds || RESEND_SECONDS);
      setExpiresIn(res.expiresInSeconds || EXPIRY_SECONDS);
    } else {
      setError(res.message);
      if (res.retryAfterSeconds) setCooldown(res.retryAfterSeconds);
    }
    focusAt(0);
  }

  function handleChangeEmail() {
    setStep("email");
    setError(null);
    setSuccess(null);
    setNotVerified(false);
    setDigits(emptyDigits());
    setVerified(false);
  }

  return (
    <div>
      <PasswordResetSteps current={step === "email" ? 1 : 2} />

      {step === "email" ? (
        <>
          <h1 className="mb-2 text-[1.6rem] font-bold leading-tight text-navy-900">
            Forgot password
          </h1>
          <p className="mb-6 text-muted">
            Enter your registered email address and we&apos;ll send you a 6-digit verification code.
          </p>

          <form className="grid gap-4" onSubmit={handleSendOtp} noValidate>
            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(undefined);
                if (error) setError(null);
                if (notVerified) setNotVerified(false);
              }}
              error={emailError}
            />

            {error && <Alert tone="error">{error}</Alert>}
            {notVerified && (
              <p className="text-sm">
                <Link
                  href={`/verify-otp?email=${encodeURIComponent(email.trim())}`}
                  className="font-semibold text-navy-600 hover:underline"
                >
                  Verify your email now →
                </Link>
              </p>
            )}
            {success && <Alert tone="success">{success}</Alert>}

            <Button type="submit" block disabled={loading}>
              {loading ? "Sending OTP…" : "Send OTP"}
            </Button>
          </form>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-[1.6rem] font-bold leading-tight text-navy-900">
            Verify OTP
          </h1>
          <p className="mb-5 text-muted">
            Enter the 6-digit code sent to <strong>{maskEmail(email)}</strong>.{" "}
            {!verified && (
              <button type="button" onClick={handleChangeEmail} className="cursor-pointer font-semibold text-navy-600 hover:underline">
                Change email
              </button>
            )}
          </p>

          <form className="grid gap-4" onSubmit={handleVerifyOtp} noValidate>
            <div role="group" aria-label="6-digit OTP" className="flex justify-center gap-2 sm:gap-3">
              {digits.map((digit, i) => (
                <input key={i}
                  ref={(el) => { inputs.current[i] = el;}}
                  value={digit}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  aria-invalid={error ? true : undefined}
                  disabled={verified || loading}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  onPaste={handleDigitPaste}
                  onFocus={(e) => e.target.select()}
                  className={`h-12 w-11 rounded-[10px] border bg-white text-center text-xl font-semibold text-ink focus:border-navy-600 focus:outline-2 focus:outline-offset-1 focus:outline-navy-600 disabled:bg-slate-100 sm:h-14 sm:w-12 ${error ? "border-red-600" : "border-line" }`}
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
              <Link href={resetUrl} className="block rounded-[10px] border border-navy-700 bg-navy-700 px-5 py-2.5 text-center font-semibold text-white hover:bg-navy-600">
                Continue to reset password
              </Link>
            ) : (
              <>
                <Button type="submit" block disabled={loading || expiresIn <= 0}>
                  {loading ? "Verifying…" : "Verify OTP"}
                </Button>
                <div className="text-center text-sm text-muted">
                  Didn&apos;t get the code?{" "}
                  <button type="button" onClick={handleResendOtp} disabled={cooldown > 0 || loading}
                    className="cursor-pointer font-semibold text-navy-600 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                  </button>
                </div>
              </>
            )}
          </form>
        </>
      )}
    </div>
  );
}
