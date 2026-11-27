
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "../../../../lib/prisma";

export async function POST(request) {
    try {
        // 1. Read request body
        const body = await request.json().catch(() => null);
        const { email, otp, newPassword } = body || {};

        // 2. Validate required fields
        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Email, OTP and new password are required",
                },
                { status: 400 }
            );
        }

        // 3. Validate input types
        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            typeof newPassword !== "string"
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid input format",
                },
                { status: 400 }
            );
        }

        // 4. Normalize and validate email
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

        // 5. Validate OTP format
        if (!/^\d{6}$/.test(otp)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "OTP must contain exactly 6 digits",
                },
                { status: 400 }
            );
        }

        // 6. Validate new password
        if (newPassword.length < 8 || newPassword.length > 128) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Password must be between 8 and 128 characters",
                },
                { status: 400 }
            );
        }

        // 7. Find registered user
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

        // 8. Find password reset OTP
        const otpRecord = await prisma.passwordResetOtp.findUnique({
            where: {
                userId: user.id,
            },
        });

        if (!otpRecord) {
            return NextResponse.json(
                {
                    success: false,
                    message: "No password reset OTP found. Please request a new OTP",
                },
                { status: 400 }
            );
        }

        // 9. Check OTP attempt limit
        if (otpRecord.attempts >= 5) {
            await prisma.passwordResetOtp.deleteMany({
                where: {
                    userId: user.id,
                    otpHash: otpRecord.otpHash,
                },
            });

            return NextResponse.json(
                {
                    success: false,
                    message: "Maximum OTP verification attempts reached. Request a new OTP",
                },
                { status: 429 }
            );
        }

        // 10. Check OTP expiry
        const now = new Date();

        if (otpRecord.expiresAt <= now) {
            await prisma.passwordResetOtp.deleteMany({
                where: {
                    userId: user.id,
                    otpHash: otpRecord.otpHash,
                },
            });

            return NextResponse.json(
                {
                    success: false,
                    message: "OTP has expired. Please request a new OTP",
                },
                { status: 400 }
            );
        }

        // 11. Compare submitted OTP with stored hash
        const isOtpValid = await bcrypt.compare(
            otp,
            otpRecord.otpHash
        );

        if (!isOtpValid) {
            // Increment failed verification attempts
            const updatedOtp = await prisma.passwordResetOtp.updateMany({
                where: {
                    userId: user.id,
                    otpHash: otpRecord.otpHash,
                    attempts: {
                        lt: 5,
                    },
                },
                data: {
                    attempts: {
                        increment: 1,
                    },
                },
            });

            if (updatedOtp.count === 1) {
                const latestOtp = await prisma.passwordResetOtp.findUnique({
                    where: {
                        userId: user.id,
                    },
                });

                if (latestOtp && latestOtp.attempts >= 5) {
                    await prisma.passwordResetOtp.deleteMany({
                        where: {
                            userId: user.id,
                            otpHash: otpRecord.otpHash,
                        },
                    });

                    return NextResponse.json(
                        {
                            success: false,
                            message: "Maximum OTP verification attempts reached. Request a new OTP",
                        },
                        { status: 429 }
                    );
                }
            }

            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid OTP",
                },
                { status: 400 }
            );
        }

        // 12. Hash the new password
        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        // 13. Delete OTP and update password in one transaction
        const passwordUpdated = await prisma.$transaction(async (tx) => {
            const deletedOtp = await tx.passwordResetOtp.deleteMany({
                where: {
                    userId: user.id,
                    otpHash: otpRecord.otpHash,
                    expiresAt: {
                        gt: now,
                    },
                    attempts: {
                        lt: 5,
                    },
                },
            });

            // Prevent reuse or concurrent password resets
            if (deletedOtp.count !== 1) {
                return false;
            }

            await tx.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    passwordHash: newPasswordHash,
                },
            });

            return true;
        });

        if (!passwordUpdated) {
            return NextResponse.json(
                {
                    success: false,
                    message: "OTP is expired or already used. Please request a new OTP",
                },
                { status: 400 }
            );
        }

        // 14. Success response
        return NextResponse.json(
            {
                success: true,
                message: "Password reset successfully. Please login with your new password",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Reset Password API Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
            },
            { status: 500 }
        );
    }
}
