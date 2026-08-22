import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, otpVerifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";

// SMTP Transporter Config for OTP Emails
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Auth Request ${requestId}] Received OTP/Login request`);

  try {
    const body = await request.json();
    const { action, email, otp, password, portal } = body;

    console.log(`[Auth Request ${requestId}] Action: ${action}, Email: ${email}`);

    // Action 1: Admin Login
    if (action === "admin_login") {
      if (!email || !password) {
        return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
      }

      if (email.trim().toLowerCase() === "om5555enterprises@gmail.com" && password === "Om@5555") {
        try {
          const cookieStore = await cookies();
          cookieStore.set("admin_session", email.trim().toLowerCase(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
          });
          console.log(`[Auth Request ${requestId}] admin_session set for ${email}`);
          return NextResponse.json({ success: true, message: "Admin login successful" });
        } catch (cookieError) {
          console.error(`[Auth Request ${requestId}] Cookie Error:`, cookieError);
          return NextResponse.json({ success: false, error: "Failed to set session cookie" }, { status: 500 });
        }
      } else {
        return NextResponse.json({ success: false, error: "Invalid admin credentials" }, { status: 401 });
      }
    }

    if (!email) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address" }, { status: 400 });
    }

    // Action 2: Send OTP
    if (action === "send") {
      // Check admin portal validation
      if (portal === "admin") {
        if (email.trim().toLowerCase() !== "om5555enterprises@gmail.com") {
          return NextResponse.json(
            { success: false, error: "Unauthorized email address. This portal is for administrators only." },
            { status: 403 }
          );
        }
      }

      // Generate 6 digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Clear existing OTPs for this email
      await db.delete(otpVerifications).where(eq(otpVerifications.email, email));

      // Insert new OTP
      await db.insert(otpVerifications).values({
        email: email.trim().toLowerCase(),
        otp: generatedOtp,
        expiresAt: expiresAt.toISOString(),
      });

      // Send OTP via SMTP (Nodemailer)
      try {
        await transporter.sendMail({
          from: `"OM Enterprises Support" <${process.env.SMTP_USER}>`,
          to: email.trim().toLowerCase(),
          subject: "OM Enterprises - Login Verification OTP",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #0D47A1; margin-top: 0;">OM Enterprises Verification Code</h2>
              <p>Please use the verification code below to complete your login request:</p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #FF9800; font-family: monospace;">${generatedOtp}</span>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">This OTP will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
            </div>
          `,
        });
        console.log(`[Auth Request ${requestId}] OTP successfully sent to ${email}`);
      } catch (mailError: any) {
        console.error(`[Auth Request ${requestId}] Mail Sender Error:`, mailError);
        return NextResponse.json({ success: false, error: "Failed to send email. Please verify your email and try again." }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "OTP sent successfully to your email" });
    }

    // Action 3: Verify OTP
    if (action === "verify") {
      if (!otp) {
        return NextResponse.json({ success: false, error: "Verification code is required" }, { status: 400 });
      }

      console.log(`[Auth Request ${requestId}] Verifying OTP for ${email}`);
      
      const otpRecords = await db.select()
        .from(otpVerifications)
        .where(
          and(
            eq(otpVerifications.email, email.trim().toLowerCase()),
            eq(otpVerifications.otp, otp)
          )
        );

      const validRecord = otpRecords.some(record => new Date(record.expiresAt) > new Date());

      if (!validRecord) {
        return NextResponse.json({ success: false, error: "Invalid or expired verification code. Please try again." }, { status: 400 });
      }

      // Delete the OTP as it's been used
      await db.delete(otpVerifications).where(eq(otpVerifications.email, email.trim().toLowerCase()));

      let user = null;
      let isNewUser = false;
      const lowerEmail = email.trim().toLowerCase();

      try {
        console.log(`[Auth Request ${requestId}] Querying database for email: ${lowerEmail}`);
        const userResult = await db.select()
          .from(users)
          .where(eq(users.email, lowerEmail))
          .limit(1);
        
        user = userResult[0];

        if (!user) {
          console.log(`[Auth Request ${requestId}] New user detected, requesting name registration`);
          isNewUser = true;
        } else if (!user.fullName) {
          console.log(`[Auth Request ${requestId}] User exists but profile name is not complete`);
          isNewUser = true;
        } else {
          // Update lastLoginAt
          await db.update(users)
            .set({ lastLoginAt: new Date().toISOString() })
            .where(eq(users.email, lowerEmail));

          // Set secure cookie
          const cookieStore = await cookies();
          cookieStore.set("auth_session", lowerEmail, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
          });
          console.log(`[Auth Request ${requestId}] auth_session set for existing user ${lowerEmail}`);
        }
      } catch (dbError: any) {
        console.error(`[Auth Request ${requestId}] Database Error:`, dbError.message);
        throw dbError;
      }

      return NextResponse.json({ 
        success: true, 
        isNewUser, 
        email: lowerEmail,
        message: isNewUser ? "Welcome! Please tell us your name." : "Welcome back!" 
      });
    }

    return NextResponse.json({ success: false, error: "Invalid request action" }, { status: 400 });

  } catch (error: any) {
    console.error(`[Auth Request ${requestId}] Critical Server Error:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: "A critical server error occurred. Please check server logs for details." 
    }, { status: 500 });
  }
}
