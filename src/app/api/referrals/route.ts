
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { authenticate } from "../../../lib/auth";

// GET /api/referrals
// Fetch referrals made by the logged-in participant

export async function GET(request: Request) {
  try {
    // 1. Authenticate the user
    const authUser = authenticate(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // 2. Only participants can access their referrals
    if (authUser.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          success: false,
          message: "Only participants can access referrals",
        },
        { status: 403 }
      );
    }

    // 3. Check whether the logged-in participant exists
    const user = await prisma.user.findUnique({
      where: {
        id: authUser.userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user || user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          success: false,
          message: "Participant not found",
        },
        { status: 404 }
      );
    }

    // 4. Fetch referrals created by this participant
    const referrals = await prisma.referral.findMany({
      where: {
        referrerId: authUser.userId,
      },
      include: {
        referredUser: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 5. Return referral details
    return NextResponse.json(
      {
        success: true,
        message: "Referrals retrieved successfully",
        data: referrals,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Referrals API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve referrals",
      },
      { status: 500 }
    );
  }
}


// POST /api/referrals
// Create a referral relationship

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const authUser = authenticate(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // 2. Only participants can create referrals
    if (authUser.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          success: false,
          message: "Only participants can create referrals",
        },
        { status: 403 }
      );
    }

    // 3. Read request body
    let body: {
      referrerUserId?: unknown;
      referredUserId?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    const referrerUserId =
      typeof body.referrerUserId === "string"
        ? body.referrerUserId.trim()
        : "";

    const referredUserId =
      typeof body.referredUserId === "string"
        ? body.referredUserId.trim()
        : "";

    // 4. Validate required fields
    if (!referrerUserId || !referredUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "Both referrerUserId and referredUserId are required",
        },
        { status: 400 }
      );
    }

    // 5. Validate the logged-in referrer
    const referrer = await prisma.user.findUnique({
      where: {
        id: authUser.userId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
      },
    });

    if (!referrer) {
      return NextResponse.json(
        {
          success: false,
          message: "Referrer not found",
        },
        { status: 404 }
      );
    }

    if (referrer.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          success: false,
          message: "Only participants can refer users",
        },
        { status: 403 }
      );
    }

    // 6. Ensure the supplied referrer ID belongs to the logged-in user
    if (referrerUserId !== referrer.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Referrer ID does not match the logged-in user",
        },
        { status: 403 }
      );
    }

    // 7. Find the referred user
    const referredUser = await prisma.user.findUnique({
      where: {
        userId: referredUserId,
      },
      select: {
        id: true,
        userId: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!referredUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Referred user not found",
        },
        { status: 404 }
      );
    }

    // 8. Only participants can be referred
    if (referredUser.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          success: false,
          message: "Only participant accounts can be referred",
        },
        { status: 400 }
      );
    }

    // 9. Prevent self-referral
    if (referrer.id === referredUser.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot refer yourself",
        },
        { status: 400 }
      );
    }

    // 10. Check whether the referred user already has a referral
    const existingReferral = await prisma.referral.findUnique({
      where: {
        referredUserId: referredUser.id,
      },
    });

    if (existingReferral) {
      return NextResponse.json(
        {
          success: false,
          message: "This user has already been referred",
        },
        { status: 409 }
      );
    }

    // 11. Create the referral relationship
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: referredUser.id,
      },
      include: {
        referredUser: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // 12. Return the created referral
    return NextResponse.json(
      {
        success: true,
        message: "Referral created successfully",
        data: referral,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle duplicate referral attempts, including concurrent requests
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This user has already been referred",
        },
        { status: 409 }
      );
    }

    console.error("Create Referral API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create referral",
      },
      { status: 500 }
    );
  }
}
