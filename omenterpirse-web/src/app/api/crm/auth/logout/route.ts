import { NextResponse } from "next/server";
import { clearCrmSession } from "@/lib/crmAuth";

export async function POST() {
  try {
    await clearCrmSession();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Logout failed." }, { status: 500 });
  }
}
