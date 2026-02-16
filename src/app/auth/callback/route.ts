import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const { data: existingUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", user.email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        const existingUserId = existingUsers[0]?.id as string | undefined;

        if (existingUserId && existingUserId !== user.id) {
          await supabase.auth.signOut();

          const conflictUrl = new URL("/login", origin);
          conflictUrl.searchParams.set(
            "error",
            "Account exists with this email. Sign in with your original method first.",
          );

          return NextResponse.redirect(conflictUrl);
        }
      }
    }
  }

  return NextResponse.redirect(origin);
}
