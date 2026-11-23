
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

import { prisma } from "../../../../lib/prisma";
import { sendOtpEmail } from "../../../../lib/email";

export async function POST(request) {
  try {
    // 1. Receive email
    
    const body = await request.json().catch(() => null);
    const email = body?.email;

    // 2. Validate email
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 }
      );
    }

    // 3. Find registered user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "No registered account found with this email",
        },
        { status: 404 }
      );
    }

    // 4. Prevent OTP requests for verified users
    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: "Email is already verified" },
        { status: 400 }
      );
    }

    const now = new Date();

    // 5. Find existing OTP record
    const existingOtp = await prisma.otpVerification.findUnique({
      where: { userId: user.id },
    });

    // 6. Rate limiting configuration
    const cooldownSeconds = 60;
    const maxRequests = 5;
    const windowMilliseconds = 60 * 60 * 1000;

    if (existingOtp) {
      const secondsSinceLastRequest =
        (now.getTime() - existingOtp.lastSentAt.getTime()) / 1000;

      // Check 60-second cooldown
      if (secondsSinceLastRequest < cooldownSeconds) {
        const remainingSeconds = Math.ceil(
          cooldownSeconds - secondsSinceLastRequest
        );

        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          },
          { status: 429 }
        );
      }

      // Check whether the one-hour window expired
      const windowExpired =
        now.getTime() - existingOtp.windowStartedAt.getTime() >=
        windowMilliseconds;

      // Check maximum request limit
      if (!windowExpired && existingOtp.requestCount >= maxRequests) {
        return NextResponse.json(
          {
            success: false,
            message: "OTP request limit reached. Try again later",
          },
          { status: 429 }
        );
      }
    }

    // 7. Generate a secure six-digit OTP
    const otp = randomInt(100000, 1000000).toString();

    // 8. Hash OTP
    const otpHash = await bcrypt.hash(otp, 10);

    // 9. Set expiry to five minutes
    const expiresAt = new Date(
      now.getTime() + 5 * 60 * 1000
    );

    // 10. Store OTP hash in PostgreSQL
    if (!existingOtp) {
      await prisma.otpVerification.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt,
          lastSentAt: now,
          windowStartedAt: now,
          requestCount: 1,
        },
      });
    } else {
      const windowExpired =
        now.getTime() - existingOtp.windowStartedAt.getTime() >=
        windowMilliseconds;

      await prisma.otpVerification.update({
        where: { userId: user.id },
        data: {
          otpHash,
          expiresAt,
          lastSentAt: now,

          requestCount: windowExpired
            ? 1
            : existingOtp.requestCount + 1,

          windowStartedAt: windowExpired
            ? now
            : existingOtp.windowStartedAt,
        },
      });
    }

    // 11. Send OTP email
    try {
      await sendOtpEmail(
        normalizedEmail,
        otp,
        user.fullName
      );
    } catch (emailError) {
      console.error("OTP Email Error:", emailError);

      // Invalidate OTP if email delivery fails
      await prisma.otpVerification.update({
        where: { userId: user.id },
        data: { expiresAt: now },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Unable to send OTP email. Please try again later",
        },
        { status: 502 }
      );
    }

    // 12. Success response
    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully to your registered email",
        expiresIn: 300,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Send OTP Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
