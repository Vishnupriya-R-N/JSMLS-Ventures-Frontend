
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthUser {
  userId: string;
  publicUserId: string;
  role: "PARTICIPANT" | "ADMIN" | "FINANCE_OFFICER" | "SUPER_ADMIN";
}

export function authenticate(request: Request): AuthUser | null {
  try {
    let token: string | undefined;

    // 1. First check the authentication cookie
    const cookieHeader = request.headers.get("cookie");

    if (cookieHeader) {
      const authCookie = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("authToken="));

      if (authCookie) {
        token = authCookie.substring("authToken=".length);
      }
    }

    // 2. Support Bearer token as a fallback
    if (!token) {
      const authHeader = request.headers.get("authorization");

      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    // 3. Get JWT secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    // 4. Verify JWT
    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string") {
      return null;
    }

    const payload = decoded as JwtPayload;

    const allowedRoles = [
      "PARTICIPANT",
      "ADMIN",
      "FINANCE_OFFICER",
      "SUPER_ADMIN",
    ];

    if (
      typeof payload.userId !== "string" ||
      typeof payload.publicUserId !== "string" ||
      !allowedRoles.includes(payload.role)
    ) {
      return null;
    }

    // 5. Return authenticated user
    return {
      userId: payload.userId,
      publicUserId: payload.publicUserId,
      role: payload.role as AuthUser["role"],
    };
  } catch {
    return null;
  }
}

export function hasRole(
  user: AuthUser,
  allowedRoles: AuthUser["role"][]
): boolean {
  return allowedRoles.includes(user.role);
}

export interface PasswordResetPayload {
  userId: string;
  email: string;
}

export function signPasswordResetToken(userId: string, email: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      purpose: "password_reset",
      userId,
      email,
    },
    jwtSecret,
    { expiresIn: "10m" }
  );
}

export function verifyPasswordResetToken(
  token: string
): PasswordResetPayload | null {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === "string") {
      return null;
    }

    const payload = decoded as JwtPayload;
    if (
      payload.purpose !== "password_reset" ||
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

