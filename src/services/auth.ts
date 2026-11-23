import type { LoginPayload, RegisterPayload, ServiceResult, Role } from "@/types";

const LOGIN_PATH = "/auth/login";
const REGISTER_PATH = "/auth/register";
const SEND_OTP_PATH = "/auth/send-otp";
const VERIFY_OTP_PATH = "/auth/verify-otp";

export type LoginUser = { userId?: string; fullName?: string; role?: Role };

export type LoginResult =
  | { ok: true; message: string; user?: LoginUser }
  | { ok: false; message: string; notVerified?: boolean };

// Changed API_URL to point to the internal Next.js API routes
const API_URL = "/api";

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function loginUser(payload: LoginPayload): Promise<LoginResult> {
  try {
    const { res, data } = await postJson(LOGIN_PATH, {
      email: payload.identifier, // FIX: Backend expects `email`, not `identifier`
      password: payload.password,
    });

    // FIX: Check data.success because your backend returns { success: true }
    if (res.ok && data.success) {
      return { ok: true, message: data.message ?? "Login successful.", user: data.user };
    }
    
    // Handle specific backend error codes
    if (res.status === 401) {
      return { ok: false, message: data.message ?? "Invalid email or password." };
    }
    if (res.status === 403) {
      return {
        ok: false,
        message: data.message ?? "Your account is not verified or is not active.",
        notVerified: data.code === "EMAIL_NOT_VERIFIED",
      };
    }
    if (res.status === 429) {
      return { ok: false, message: data.message ?? "Too many login attempts. Please try again later." };
    }
    if (res.status === 400) {
      return { ok: false, message: data.message ?? "Please check your details and try again." };
    }
    
    // Fallback for any other error
    return { ok: false, message: data.message ?? "Login failed. Please try again later." };
  } catch {
    return { ok: false, message: "Cannot reach the server. Check your connection and try again." };
  }
}

export async function registerUser(payload: RegisterPayload): Promise<ServiceResult> {
  try {
    const { res, data } = await postJson(REGISTER_PATH, payload);
    
    if (res.ok && data.success) {
      return { ok: true, message: data.message ?? "Registration successful." };
    }
    
    // Handle validation errors or duplicate emails
    if (res.status === 400 || res.status === 409) {
      return { ok: false, message: data.message ?? "Registration failed. Please check your details." };
    }
    
    return { ok: false, message: data.message ?? "Registration failed. Please try again later." };
  } catch {
    return { ok: false, message: "Cannot reach the server. Check your connection and try again." };
  }
}

export type SendOtpResult =
  | { ok: true; message: string; expiresInSeconds: number; resendAfterSeconds: number }
  | { ok: false; message: string; retryAfterSeconds?: number };

export type VerifyOtpResult = { ok: boolean; message: string };

export async function sendOtp(email: string): Promise<SendOtpResult> {
  try {
    const { res, data } = await postJson(SEND_OTP_PATH, { email });
    
    if (res.ok) {
      return {
        ok: true,
        message: data.message ?? "OTP sent to your email.",
        expiresInSeconds: data.expiresIn ?? data.expiresInSeconds ?? 300,
        resendAfterSeconds: data.resendAfterSeconds ?? 60,
      };
    }
    
    if (res.status === 429) {
      const retry = Number(res.headers.get("Retry-After")) || data.retryAfterSeconds || 60;
      return {
        ok: false,
        message: data.message ?? "Too many requests. Please try again later.",
        retryAfterSeconds: retry,
      };
    }
    
    if (res.status === 400) {
      return { ok: false, message: data.message ?? "Please check the email address and try again." };
    }
    
    return { ok: false, message: data.message ?? "Could not send the OTP. Please try again later." };
  } catch {
    return { ok: false, message: "Cannot reach the server. Check your connection and try again." };
  }
}

export async function verifyOtp(email: string, otp: string): Promise<VerifyOtpResult> {
  try {
    const { res, data } = await postJson(VERIFY_OTP_PATH, { email, otp });
    
    if (res.ok) {
      return { ok: true, message: data.message ?? "Email verified successfully." };
    }
    
    if (res.status === 429) {
      return { ok: false, message: data.message ?? "Too many attempts. Please wait and try again." };
    }
    
    // 400/401/410 etc.: wrong or expired OTP. Show the backend's own message.
    return { ok: false, message: data.message ?? "Incorrect or expired OTP. Please try again." };
  } catch {
    return { ok: false, message: "Cannot reach the server. Check your connection and try again." };
  }
}