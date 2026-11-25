
import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";

const COOLDOWN_SECONDS = 60;
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000;
const OTP_EXPIRY_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null);
        const email = body?.email;

        if (typeof email !== "string" || !email.trim()) {
            return NextResponse.json(
                { success: false, message: "Email is required." },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return NextResponse.json(
                { success: false, message: "Invalid email address." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "No registered account found with this email.", }, { status: 404 }
            );
        }

        // Only verified accounts can reset passwords.
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

        const now = new Date();

        const existingOtp = await prisma.otpVerification.findUnique({
            where: { userId: user.id },
        });

        if (existingOtp) {
            const secondsSinceLastRequest = (now.getTime() - existingOtp.lastSentAt.getTime()) / 1000;
            if (secondsSinceLastRequest < COOLDOWN_SECONDS) {
                const retryAfterSeconds = Math.ceil(COOLDOWN_SECONDS - secondsSinceLastRequest);
                return NextResponse.json(
                    {
                        success: false,
                        message: `Please wait ${retryAfterSeconds} seconds before requesting another OTP.`,
                        retryAfterSeconds,
                    },
                    {
                        status: 429,
                        headers: { "Retry-After": String(retryAfterSeconds) },
                    }
                );
            }

            const windowExpired = now.getTime() - existingOtp.windowStartedAt.getTime() >= WINDOW_MS;
            if (!windowExpired && existingOtp.requestCount >= MAX_REQUESTS) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "OTP request limit reached. Try again later.",
                    },
                    { status: 429 }
                );
            }
        }

        const otp = randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

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
                now.getTime() - existingOtp.windowStartedAt.getTime() >= WINDOW_MS;

            await prisma.otpVerification.update({
                where: { userId: user.id },
                data: {
                    otpHash,
                    expiresAt,
                    lastSentAt: now,
                    requestCount: windowExpired ? 1 : existingOtp.requestCount + 1,
                    windowStartedAt: windowExpired ? now : existingOtp.windowStartedAt,
                },
            });
        }

        // Send the actual email.
        try {
            await sendPasswordResetEmail(normalizedEmail, otp, user.fullName || "User");
        } catch (emailError) {
            console.error("Password Reset Email Error:", emailError);

            // Invalidate the OTP if email sending fails.
            await prisma.otpVerification.updateMany({ where: { userId: user.id, otpHash, }, data: { expiresAt: now, }, });

            return NextResponse.json(
                {
                    success: false,
                    message: "Unable to send OTP email. Please try again later.",
                },
                { status: 502 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Password reset OTP sent successfully.",
                expiresInSeconds: 300,
                resendAfterSeconds: 60,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Send Password Reset OTP Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error.",
            },
            { status: 500 }
        );
    }
}
