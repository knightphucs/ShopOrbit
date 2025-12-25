import { NextRequest, NextResponse } from "next/server";
import { env } from "../../../../env";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);

    const userId = url.searchParams.get("userId");
    const token = url.searchParams.get("token");

    if (!userId || !token) {
        return NextResponse.json(
            { message: "Missing userId or token" },
            { status: 400 }
        );
    }

    // Forward sang Gateway (KHÔNG gọi thẳng Identity)
    const upstreamUrl =
        `${env.gatewayUrl}/api/auth/confirm-email` +
        `?userId=${encodeURIComponent(userId)}` +
        `&token=${encodeURIComponent(token)}`;

    const res = await fetch(upstreamUrl, { method: "GET" });
    const text = await res.text();

    return new NextResponse(text, {
        status: res.status,
        headers: {
            "Content-Type": res.headers.get("content-type") ?? "application/json",
        },
    });
}
