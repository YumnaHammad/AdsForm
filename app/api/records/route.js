import { NextResponse } from "next/server";
import { getAllSubmittedRecords } from "@/lib/db";

// GET - Get all submitted records
export async function GET() {
  try {
    const records = await getAllSubmittedRecords();
    return NextResponse.json(
      { success: true, data: records },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}
