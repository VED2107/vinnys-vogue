import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Password recovery → send to update-password page
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/update-password`);
  }

  // Custom next param (e.g. deep-link back to a specific page)
  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Default: signup confirm, email change confirm, OAuth, magic link → account
  return NextResponse.redirect(`${origin}/account`);
}
