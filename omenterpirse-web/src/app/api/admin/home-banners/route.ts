import { NextResponse } from "next/server";
import { db } from "@/db";
import { homeCategoryBanners } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isAdminNumber } from "@/lib/admin";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  return session ? isAdminNumber(session) : false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";
    
    // Only admins can see inactive banners
    if (showAll && !await isAdmin()) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const items = await db.select()
      .from(homeCategoryBanners)
      .where(!showAll ? eq(homeCategoryBanners.isActive, true) : undefined)
      .orderBy(asc(homeCategoryBanners.displayOrder));
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Fetch Banners Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch banners: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await db.insert(homeCategoryBanners).values({
      title: body.title,
      imageUrl: body.imageUrl,
      mobileImageUrl: body.mobileImageUrl,
      linkHref: body.linkHref,
      displayOrder: body.displayOrder || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    }).returning();
    
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("Create Banner Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create banner: " + (error instanceof Error ? error.message : String(error))
    }, { status: 400 });
  } finally {
    revalidatePath("/", "layout");
  }
}

export async function PUT(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      // Bulk update (reordering)
      for (const item of body) {
        await db.update(homeCategoryBanners)
          .set({ displayOrder: item.displayOrder })
          .where(eq(homeCategoryBanners.id, item.id));
      }
      return NextResponse.json({ success: true });
    } else {
      const { id, ...updates } = body;
      const result = await db.update(homeCategoryBanners)
        .set(updates)
        .where(eq(homeCategoryBanners.id, id))
        .returning();

      if (result.length > 0) {
        return NextResponse.json({ success: true, data: result[0] });
      }
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Update Banner Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update banner: " + (error instanceof Error ? error.message : String(error))
    }, { status: 400 });
  } finally {
    revalidatePath("/", "layout");
  }
}

export async function DELETE(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    
    await db.delete(homeCategoryBanners).where(eq(homeCategoryBanners.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Banner Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete banner: " + (error instanceof Error ? error.message : String(error))
    }, { status: 400 });
  } finally {
    revalidatePath("/", "layout");
  }
}
