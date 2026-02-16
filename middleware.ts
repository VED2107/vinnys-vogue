import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(req);
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/account/:path*", "/order/:path*"],
};
