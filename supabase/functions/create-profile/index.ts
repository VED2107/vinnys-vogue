/// <reference path="../deno.d.ts" />
/// <reference path="../esm-sh.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
};

type AuthWebhookPayload = {
  type: string;
  table: string;
  record: AuthUser;
};

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", {
        status: 500,
      });
    }

    const payload = (await req.json()) as AuthWebhookPayload;

    const user = payload?.record;
    if (!user?.id) {
      return new Response("Missing user record", { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error } = await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        phone: user.phone ?? null,
        role: "user",
      },
      { onConflict: "id" },
    );

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
