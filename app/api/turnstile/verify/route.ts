import { NextRequest, NextResponse } from "next/server";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing token" },
        { status: 400 },
      );
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);

    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const verifyData = await verifyRes.json();

    return NextResponse.json({
      success: Boolean(verifyData?.success),
      errors: verifyData?.["error-codes"] ?? [],
    });
  } catch (error) {
    console.error("Turnstile verify error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 },
    );
  }
}
