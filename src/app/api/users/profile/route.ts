
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { authenticate } from "../../../../lib/auth";

// GET: Retrieve logged-in user's profile
export async function GET(request: Request) {
  try {
    // 1. Authenticate user
    const authUser = await authenticate(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Invalid or missing token.",
        },
        { status: 401 }
      );
    }

    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: {
        id: authUser.userId,
      },
      select: {
        userId: true,
        fullName: true,
        email: true,
        mobile: true,
        isVerified: true,
        isApproved: true,
      },
    });

    // 3. Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // 4. Determine account status
    let accountStatus = "PENDING_VERIFICATION";

    if (user.isVerified && !user.isApproved) {
      accountStatus = "PENDING_APPROVAL";
    } else if (user.isVerified && user.isApproved) {
      accountStatus = "ACTIVE";
    }

    // 5. Return profile
    return NextResponse.json(
      {
        success: true,
        message: "User profile retrieved successfully",
        data: {
          userId: user.userId,
          name: user.fullName,
          email: user.email,
          mobileNumber: user.mobile,
          accountStatus: accountStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Profile API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while retrieving profile",
      },
      { status: 500 }
    );
  }
}

// PUT: Update logged-in user's profile
export async function PUT(request: Request) {
  try {
    // 1. Authenticate user
    const authUser = await authenticate(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Invalid or missing token.",
        },
        { status: 401 }
      );
    }

    // 2. Read request body
    const body = await request.json();

    // Safely validate input types before trimming
    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const mobileNumber =
      typeof body.mobileNumber === "string"
        ? body.mobileNumber.trim()
        : "";

    // 3. Validate name
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be between 2 and 100 characters",
        },
        { status: 400 }
      );
    }

    // 4. Validate mobile number
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid 10-digit Indian mobile number",
        },
        { status: 400 }
      );
    }

    // 5. Check if mobile number belongs to another user
    const existingUser = await prisma.user.findFirst({
      where: {
        mobile: mobileNumber,
        NOT: {
          id: authUser.userId,
        },
      },
      select: {
        id: true,
      },
    });

    // 6. If another user has this mobile number, return error
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "This mobile number is already registered to another user",
        },
        { status: 409 }
      );
    }

    // 7. Update the current user's profile
    const updatedUser = await prisma.user.update({
      where: {
        id: authUser.userId,
      },
      data: {
        fullName: name,
        mobile: mobileNumber,
      },
      select: {
        userId: true,
        fullName: true,
        email: true,
        mobile: true,
        isVerified: true,
        isApproved: true,
      },
    });

    // 8. Determine account status
    let accountStatus = "PENDING_VERIFICATION";

    if (updatedUser.isVerified && !updatedUser.isApproved) {
      accountStatus = "PENDING_APPROVAL";
    } else if (updatedUser.isVerified && updatedUser.isApproved) {
      accountStatus = "ACTIVE";
    }

    // 9. Return updated profile
    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: {
          userId: updatedUser.userId,
          name: updatedUser.fullName,
          email: updatedUser.email,
          mobileNumber: updatedUser.mobile,
          accountStatus: accountStatus,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Update Profile API Error:", error);

    // 10. Handle duplicate value error
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This mobile number is already registered",
        },
        { status: 409 }
      );
    }

    // 11. Handle user not found
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // 12. Handle other errors
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating profile",
      },
      { status: 500 }
    );
  }
}
