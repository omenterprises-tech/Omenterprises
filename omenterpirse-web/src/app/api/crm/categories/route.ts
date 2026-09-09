import { NextResponse } from "next/server";
import { db } from "@/db";
import { crmCustomCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCrmSession } from "@/lib/crmAuth";
import { DEFAULT_BUSINESS_CATEGORIES } from "@/lib/crmCategoriesData";

export async function GET() {
  try {
    const session = await getCrmSession();
    let custom: string[] = [];

    if (session) {
      const records = await db
        .select({ name: crmCustomCategories.name })
        .from(crmCustomCategories)
        .where(eq(crmCustomCategories.userId, session.userId));
      custom = records.map((r) => r.name);
    }

    return NextResponse.json({
      success: true,
      defaultCategories: DEFAULT_BUSINESS_CATEGORIES,
      customCategories: custom,
    });
  } catch (error: any) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({
      success: true,
      defaultCategories: DEFAULT_BUSINESS_CATEGORIES,
      customCategories: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCrmSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const name = (body.name || "").trim();

    if (!name) {
      return NextResponse.json({ success: false, error: "Category name is required." }, { status: 400 });
    }

    await db.insert(crmCustomCategories).values({
      userId: session.userId,
      name: name,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      category: name,
    });
  } catch (error: any) {
    console.error("Add custom category error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add category." },
      { status: 500 }
    );
  }
}
