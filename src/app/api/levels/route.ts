import { NextResponse } from "next/server";
import { authenticate } from "../../../lib/auth";

// GET /api/levels
export async function GET(request: Request) {
  try {
    // 1. Verify user authentication
    const authUser = await authenticate(request);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    // 2. Demo Level Structure
    const levels = [
      {
        level: 1,
        totalPositions: 2,
        positions: [
          {
            position: 1,
            status: "OCCUPIED",
            participantId: "DEMO001",
          },
          {
            position: 2,
            status: "OCCUPIED",
            participantId: "DEMO002",
          },
        ],
      },
      {
        level: 2,
        totalPositions: 4,
        positions: [
          {
            position: 1,
            status: "OCCUPIED",
            participantId: "DEMO003",
          },
          {
            position: 2,
            status: "OCCUPIED",
            participantId: "DEMO004",
          },
          {
            position: 3,
            status: "EMPTY",
            participantId: null,
          },
          {
            position: 4,
            status: "EMPTY",
            participantId: null,
          },
        ],
      },
      {
        level: 3,
        totalPositions: 8,
        positions: [
          {
            position: 1,
            status: "OCCUPIED",
            participantId: "DEMO005",
          },
          {
            position: 2,
            status: "OCCUPIED",
            participantId: "DEMO006",
          },
          {
            position: 3,
            status: "OCCUPIED",
            participantId: "DEMO007",
          },
          {
            position: 4,
            status: "OCCUPIED",
            participantId: "DEMO008",
          },
          {
            position: 5,
            status: "EMPTY",
            participantId: null,
          },
          {
            position: 6,
            status: "EMPTY",
            participantId: null,
          },
          {
            position: 7,
            status: "EMPTY",
            participantId: null,
          },
          {
            position: 8,
            status: "EMPTY",
            participantId: null,
          },
        ],
      },
    ];

    // 3. Return the level structure
    return NextResponse.json(
      {
        success: true,
        message: "Level structure retrieved successfully",
        data: {
          levels: levels,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get Level Structure API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}