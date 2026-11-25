import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signPasswordResetToken } from "@/lib/auth";
import { isEmail } from "@/lib/validators";


export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { email, otp } = body || {};

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required." },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || typeof otp !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid input format." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isEmail(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: "OTP must contain exactly 6 digits." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, email: true, isVerified: true }, });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No registered account found with this email." },
        { status: 404 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          code: "EMAIL_NOT_VERIFIED",
          message: "Please verify your email before resetting your password.",
        },
        { status: 403 }
      );
    }

    const otpRecord = await prisma.otpVerification.findUnique({ where: { userId: user.id }, });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "No OTP found. Please request a new OTP." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (otpRecord.expiresAt <= now) {
      await prisma.otpVerification.deleteMany({ where: { userId: user.id, otpHash: otpRecord.otpHash },});
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isOtpValid) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP. Please check the code and try again." },
        { status: 400 }
      );
    }

    const deletedOtp = await prisma.otpVerification.deleteMany({
      where: {
        userId: user.id,
        otpHash: otpRecord.otpHash,
        expiresAt: { gt: now },
      },
    });

    if (deletedOtp.count !== 1) {
      return NextResponse.json(
        { success: false, message: "OTP is expired or already used. Please request a new OTP." },
        { status: 400 }
      );
    }

    const resetToken = signPasswordResetToken(user.id, user.email);

    const response = NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully. Redirecting to reset password…",
        resetToken,
      },
      { status: 200 }
    );

    response.cookies.set("passwordResetToken", resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    console.error("Verify Password Reset OTP Error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
