import { NextResponse } from "next/server";

const checkoutLinks = {
  pro: process.env.BILLING_PRO_URL,
  premium: process.env.BILLING_PREMIUM_URL
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan");

  if (plan !== "pro" && plan !== "premium") {
    return NextResponse.redirect(new URL("/upgrade", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const checkoutUrl = checkoutLinks[plan];

  if (!checkoutUrl) {
    return NextResponse.redirect(new URL("/upgrade", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  return NextResponse.redirect(checkoutUrl);
}
