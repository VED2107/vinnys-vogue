/// <reference path="../deno.d.ts" />
/// <reference path="../esm-sh.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    try {
        const { action, email, otp, password } = await req.json();
        const ip = req.headers.get("x-forwarded-for") || "unknown";

        if (!email) {
            return new Response(
                JSON.stringify({ error: "Email required" }),
                { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
            );
        }

        // Cleanup expired OTPs — non-blocking
        supabase.rpc("cleanup_expired_otps").then((res: { error: { message: string } | null }) => {
            if (res.error) console.error("cleanup_expired_otps failed:", res.error.message);
        });

        // ======================================
        // GENERATE OTP (Step 1: email only)
        // ======================================
        if (action === "generate") {
            // Check if email is already registered
            const { data: existingProfile } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", email.toLowerCase())
                .maybeSingle();

            if (existingProfile) {
                return new Response(
                    JSON.stringify({ error: "An account with this email already exists. Please sign in." }),
                    { status: 409, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            // Rate limit: 5 per hour per email
            const { count: emailCount } = await supabase
                .from("otp_rate_limits")
                .select("*", { count: "exact", head: true })
                .eq("email", email)
                .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

            if ((emailCount ?? 0) >= 5) {
                return new Response(
                    JSON.stringify({ error: "Too many requests. Try again later." }),
                    { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            // Rate limit: 5 per hour per IP
            const { count: ipCount } = await supabase
                .from("otp_rate_limits")
                .select("*", { count: "exact", head: true })
                .eq("ip_address", ip)
                .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

            if ((ipCount ?? 0) >= 5) {
                return new Response(
                    JSON.stringify({ error: "Too many requests from this network. Try again later." }),
                    { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            const otpCode = generateOTP();
            const otpHash = await bcrypt.hash(otpCode, 10);

            // Delete old signup OTPs for this email
            await supabase
                .from("signup_otps")
                .delete()
                .eq("email", email);

            // Insert new OTP (no password stored!)
            await supabase
                .from("signup_otps")
                .insert({
                    email,
                    otp_hash: otpHash,
                    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                });

            // Track rate limit
            await supabase
                .from("otp_rate_limits")
                .insert({ email, ip_address: ip });

            // Send verification email via Resend (never blocks signup flow)
            try {
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: "Vinnys Vogue <no-reply@vinnysvogue.in>",
                        to: [email],
                        subject: "Verify Your Email — Vinnys Vogue",
                        html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F8F5F0;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F5F0;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td align="center" style="padding:32px 32px 0 32px;"><img src="https://www.vinnysvogue.in/icon-512.png" width="72" height="72" alt="Vinnys Vogue" style="display:block;width:72px;height:72px;border-radius:12px;" /></td></tr>
<tr><td align="center" style="padding:20px 32px 0 32px;"><h1 style="margin:0;font-size:22px;font-weight:700;color:#1C3A2A;">Verify Your Email</h1></td></tr>
<tr><td style="padding:16px 32px 0 32px;"><div style="border-top:1px solid #E8E4DF;"></div></td></tr>
<tr><td style="padding:20px 32px 0 32px;font-size:14px;line-height:1.7;color:#333;">
<p style="margin:0 0 16px 0;">Welcome to Vinnys Vogue! Enter this code to verify your email:</p>
<div style="background:#F8F5F0;border-radius:12px;padding:24px;text-align:center;margin:0 0 16px 0;">
<span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1C3A2A;">${otpCode}</span>
</div>
<p style="margin:0;font-size:13px;color:#999;">This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
</td></tr>
<tr><td style="padding:28px 32px 32px 32px;"><div style="border-top:1px solid #E8E4DF;padding-top:16px;font-size:11px;color:#AAA;text-align:center;">© ${new Date().getFullYear()} Vinnys Vogue · <a href="https://www.vinnysvogue.in" style="color:#1C3A2A;text-decoration:none;">vinnysvogue.in</a><br/><a href="mailto:support@vinnysvogue.in" style="color:#1C3A2A;text-decoration:none;">support@vinnysvogue.in</a></div></td></tr>
</table></td></tr></table></body></html>`,
                    }),
                });
            } catch (emailErr) {
                console.error("signup-otp: OTP email send failed:", emailErr);
            }

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
            );
        }

        // ======================================
        // VERIFY OTP + CREATE USER (Step 2)
        // ======================================
        if (action === "verify") {
            if (!otp || !password) {
                return new Response(
                    JSON.stringify({ error: "OTP and password required" }),
                    { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            // Server-side password strength validation
            if (password.length < 6) {
                return new Response(
                    JSON.stringify({ error: "Password must be at least 6 characters" }),
                    { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            const { data } = await supabase
                .from("signup_otps")
                .select("*")
                .eq("email", email)
                .maybeSingle();

            if (!data) {
                return new Response(
                    JSON.stringify({ error: "No OTP found. Please request a new one." }),
                    { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            if (new Date(data.expires_at) < new Date()) {
                return new Response(
                    JSON.stringify({ error: "OTP expired. Please request a new one." }),
                    { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            if (data.attempts >= 3) {
                return new Response(
                    JSON.stringify({ error: "Too many failed attempts. Please request a new OTP." }),
                    { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            const match = await bcrypt.compare(otp, data.otp_hash);
            if (!match) {
                await supabase
                    .from("signup_otps")
                    .update({ attempts: data.attempts + 1 })
                    .eq("id", data.id);

                return new Response(
                    JSON.stringify({ error: "Incorrect OTP" }),
                    { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            // OTP verified — create the user with email_confirm: true
            const { error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });

            if (createError) {
                return new Response(
                    JSON.stringify({ error: createError.message }),
                    { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
                );
            }

            // Delete used OTP
            await supabase
                .from("signup_otps")
                .delete()
                .eq("email", email);

            // Send welcome email (never blocks signup flow)
            try {
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: "Vinnys Vogue Support <support@vinnysvogue.in>",
                        to: [email],
                        subject: "Welcome to Vinnys Vogue ✨",
                        html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F8F5F0;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F5F0;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td align="center" style="padding:32px 32px 0 32px;"><img src="https://www.vinnysvogue.in/icon-512.png" width="72" height="72" alt="Vinnys Vogue" style="display:block;width:72px;height:72px;border-radius:12px;" /></td></tr>
<tr><td align="center" style="padding:20px 32px 0 32px;"><h1 style="margin:0;font-size:22px;font-weight:700;color:#1C3A2A;">Welcome to Vinnys Vogue ✨</h1></td></tr>
<tr><td style="padding:16px 32px 0 32px;"><div style="border-top:1px solid #E8E4DF;"></div></td></tr>
<tr><td style="padding:20px 32px 0 32px;font-size:14px;line-height:1.7;color:#333;">
<p style="margin:0 0 12px 0;">Your account has been successfully created.</p>
<p style="margin:0 0 16px 0;">Welcome to <strong>Vinnys Vogue</strong> — where fashion meets elegance. Start exploring our curated collections today.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px auto 0 auto;"><tr><td align="center" style="border-radius:8px;background:#1C3A2A;"><a href="https://www.vinnysvogue.in" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background:#1C3A2A;">Explore Collection</a></td></tr></table>
</td></tr>
<tr><td style="padding:28px 32px 32px 32px;"><div style="border-top:1px solid #E8E4DF;padding-top:16px;font-size:11px;color:#AAA;text-align:center;">© ${new Date().getFullYear()} Vinnys Vogue · <a href="https://www.vinnysvogue.in" style="color:#1C3A2A;text-decoration:none;">vinnysvogue.in</a><br/><a href="mailto:support@vinnysvogue.in" style="color:#1C3A2A;text-decoration:none;">support@vinnysvogue.in</a></div></td></tr>
</table></td></tr></table></body></html>`,
                    }),
                });
            } catch (emailErr) {
                console.error("signup-otp: welcome email send failed:", emailErr);
            }

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
            );
        }

        return new Response(
            JSON.stringify({ error: "Invalid action" }),
            { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
    } catch (err) {
        console.error("signup-otp error:", err);
        const message = err instanceof Error ? err.message : "Server error";
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
    }
});
