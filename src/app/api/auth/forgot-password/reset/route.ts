import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyPasswordResetToken } from "@/lib/auth";
import { passwordError } from "@/lib/validators";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { newPassword, confirmPassword, email, resetToken } = body || {};

    const cookieToken = request.cookies.get("passwordResetToken")?.value;
    const token = cookieToken || (typeof resetToken === "string" ? resetToken : undefined);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Your password reset session has expired. Please verify your OTP again.", },
        { status: 401 }
      );
    }

    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Your password reset session is invalid or has expired. Please request a new OTP.", },
        { status: 401 }
      );
    }

    if (typeof email === "string" && email.trim()) {
      if (email.trim().toLowerCase() !== payload.email.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "Password reset session does not match this email." },
          { status: 403 }
        );
      }
    }

    if (typeof newPassword !== "string" || !newPassword) {
      return NextResponse.json(
        { success: false, message: "New password is required." },
        { status: 400 }
      );
    }

    const pwIssue = passwordError(newPassword);
    if (pwIssue) {
      return NextResponse.json(
        { success: false, message: pwIssue },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, isVerified: true }, });

    if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "Account not found." },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash }, });

    const response = NextResponse.json(
      { success: true, message: "Your password has been reset successfully. Redirecting to login…",},
      { status: 200 }
    );

    response.cookies.set("passwordResetToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Reset Password Error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
