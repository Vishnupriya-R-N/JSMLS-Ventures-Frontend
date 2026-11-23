import type { ProfileData } from "@/types";

const API_URL = "/api";
const PROFILE_PATH = "/users/profile"; 
const UPDATE_METHOD = "PUT"; // change to "PUT" if your route.ts exports PUT

export type ProfileResult =
  | { ok: true; data: ProfileData }
  | { ok: false; message: string; unauthorized?: boolean };

export type UpdateProfileResult =
  | { ok: true; message: string; data?: ProfileData }
  | { ok: false; message: string; unauthorized?: boolean };

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null;
const messageOf = (body: unknown) =>
  isObj(body) && typeof body.message === "string" ? body.message : null;

// The one place to change if the backend's field names are different.
function mapProfile(body: unknown): ProfileData | null {
  if (!isObj(body)) return null;
  
  // The backend wraps the user info inside a "data" object
  const u = isObj(body.data) ? body.data : body;

  // Backend uses `name` instead of `fullName`
  const fullName = u.name ?? u.fullName;
  
  // Backend uses `mobileNumber` instead of `mobile`
  const mobile = u.mobileNumber ?? u.mobile ?? u.phone;
  
  // Backend uses `userId` (which is the public ID like VC100001)
  if (typeof fullName !== "string" || typeof u.userId !== "string" || typeof u.email !== "string") {
    return null;
  }
  
  return {
    fullName,
    userId: u.userId,
    email: u.email,
    mobile: typeof mobile === "string" ? mobile : "",
  };
}

export async function getProfile(): Promise<ProfileResult> {
  try {
    // Same-origin requests send the session cookie automatically.
    const res = await fetch(`${API_URL}${PROFILE_PATH}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body: unknown = await res.json().catch(() => null);

    if (res.ok) {
      const data = mapProfile(body);
      return data
        ? { ok: true, data }
        : { ok: false, message: "The server sent an unexpected response. Please try again later." };
    }
    if (res.status === 401) {
      return { ok: false, unauthorized: true, message: "Please log in to see your profile." };
    }
    return { ok: false, message: messageOf(body) ?? "Could not load your profile. Please try again." };
  } catch {
    return { ok: false, message: "Cannot reach the server. Check your connection and try again." };
  }
}

export async function updateProfile(payload: {
  fullName: string;
  mobile: string;
}): Promise<UpdateProfileResult> {
  try {
    const res = await fetch(`${API_URL}${PROFILE_PATH}`, {
      method: UPDATE_METHOD,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const body: unknown = await res.json().catch(() => null);

    if (res.ok) {
      return {
        ok: true,
        message: messageOf(body) ?? "Profile updated successfully.",
        data: mapProfile(body) ?? undefined,
      };
    }
    if (res.status === 401) {
      return { ok: false, unauthorized: true, message: "Your session has ended. Please log in again." };
    }
    if (res.status === 400 || res.status === 409 || res.status === 422) {
      return { ok: false, message: messageOf(body) ?? "Please check your details and try again." };
    }
    return { ok: false, message: "Could not save your changes. Please try again later." };
  } catch {
    return { ok: false, message: "Cannot reach the server. Check your connection and try again." };
  }
}