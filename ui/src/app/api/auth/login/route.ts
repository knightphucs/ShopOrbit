import { NextRequest, NextResponse } from "next/server";
import { env } from "../../../../env";

export async function POST(req: NextRequest) {
    const body = await req.text();

    const upstream = await fetch(
        `${env.gatewayUrl}/api/auth/login`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
        }
    );

    const data = await upstream.text();

    return new NextResponse(data, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
    });
}
