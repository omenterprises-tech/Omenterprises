import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("auth_session")?.value;

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const cleanDigits = session.replace(/\D/g, "");
    const cleanPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : "";

    const userResult = await db.select()
      .from(users)
      .where(
        or(
          eq(users.email, session),
          eq(users.phoneNumber, session),
          ...(cleanPhone ? [eq(users.phoneNumber, cleanPhone)] : [])
        )
      )
      .limit(1);

    const user = userResult[0];

    if (!user) {
      const response = NextResponse.json({ authenticated: false });
      response.cookies.delete("auth_session");
      return response;
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
      } 
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
