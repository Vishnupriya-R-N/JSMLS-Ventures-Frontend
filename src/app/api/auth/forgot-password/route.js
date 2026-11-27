
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

import { prisma } from "../../../../lib/prisma";
import { sendPasswordResetEmail } from "../../../../lib/password-reset-email";

export async function POST(request) {
    try {
        // 1. Read request body
        const body = await request.json().catch(() => null);
        const { email } = body || {};

        // 2. Validate email
        if (!email || typeof email !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email is required",
                },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email address",
                },
                { status: 400 }
            );
        }

        // 3. Find registered user
        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No registered account found",
                },
                { status: 404 }
            );
        }

        const now = new Date();

        // 4. Check existing password reset OTP
        const existingOtp = await prisma.passwordResetOtp.findUnique({
            where: {
                userId: user.id,
            },
        });

        // 5. Enforce 60-second resend cooldown
        if (existingOtp) {
            const secondsSinceLastSent = Math.floor(
                (now.getTime() - existingOtp.lastSentAt.getTime()) / 1000
            );

            if (secondsSinceLastSent < 60) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Please wait before requesting another OTP",
                        resendAfterSeconds: 60 - secondsSinceLastSent,
                    },
                    { status: 429 }
                );
            }
        }

        // 6. Enforce maximum 5 requests per hour
        let windowStartedAt = now;
        let requestCount = 1;

        if (existingOtp) {
            const windowAge =
                now.getTime() - existingOtp.windowStartedAt.getTime();

            const oneHour = 60 * 60 * 1000;

            if (windowAge < oneHour) {
                if (existingOtp.requestCount >= 5) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: "Maximum OTP requests reached. Try again after one hour",
                        },
                        { status: 429 }
                    );
                }

                windowStartedAt = existingOtp.windowStartedAt;
                requestCount = existingOtp.requestCount + 1;
            }
        }

        // 7. Generate a secure six-digit OTP
        const otp = randomInt(100000, 1000000).toString();

        // 8. Hash OTP before storing it
        const otpHash = await bcrypt.hash(otp, 10);

        // 9. Set expiry to 5 minutes
        const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

        // 10. Store OTP in PasswordResetOtp table
        await prisma.passwordResetOtp.upsert({
            where: {
                userId: user.id,
            },
            update: {
                otpHash,
                expiresAt,
                lastSentAt: now,
                windowStartedAt,
                requestCount,
                attempts: 0,
            },
            create: {
                userId: user.id,
                otpHash,
                expiresAt,
                lastSentAt: now,
                windowStartedAt,
                requestCount,
                attempts: 0,
            },
        });

        // 11. Send OTP email
        try {
            await sendPasswordResetEmail(
                normalizedEmail,
                otp,
                user.fullName
            );
        } catch (emailError) {
            console.error("Password reset email error:", emailError);

            // Invalidate OTP if email delivery fails
            await prisma.passwordResetOtp.deleteMany({
                where: {
                    userId: user.id,
                    otpHash,
                },
            });

            return NextResponse.json(
                {
                    success: false,
                    message: "Unable to send password reset OTP. Please try again",
                },
                { status: 500 }
            );
        }

        // 12. Success response
        return NextResponse.json(
            {
                success: true,
                message: "Password reset OTP sent successfully",
                expiresIn: 300,
                resendAfterSeconds: 60,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Forgot Password API Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
            },
            { status: 500 }
        );
    }
}
