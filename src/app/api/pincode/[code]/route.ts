import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: { code: string } },
) {
    const code = params.code;

    if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
            { error: "Invalid pincode" },
            { status: 400 },
        );
    }

    try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
            next: { revalidate: 86400 },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Pincode service unavailable" },
                { status: 502 },
            );
        }

        const json = await res.json();
        const result = json?.[0];

        if (!result || result.Status !== "Success" || !result.PostOffice?.length) {
            return NextResponse.json(
                { city: null, state: null },
                { status: 200 },
            );
        }

        const po = result.PostOffice[0];

        return NextResponse.json({
            city: po.District ?? po.Division ?? null,
            state: po.State ?? null,
        });
    } catch {
        return NextResponse.json(
            { error: "Pincode lookup failed" },
            { status: 502 },
        );
    }
}
