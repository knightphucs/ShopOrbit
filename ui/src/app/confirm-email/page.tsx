"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConfirmEmailPage() {
    const router = useRouter();
    const sp = useSearchParams();

    const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
    const [message, setMessage] = useState<string>("Confirming...");

    useEffect(() => {
        const userId = sp.get("userId");
        const token = sp.get("token");

        if (!userId || !token) {
            setStatus("error");
            setMessage("Missing userId or token.");
            return;
        }

        (async () => {
            try {
                const res = await fetch(
                    `/api/auth/confirm-email?userId=${encodeURIComponent(
                        userId
                    )}&token=${encodeURIComponent(token)}`,
                    { method: "GET" }
                );

                const data = await res.json().catch(() => null);

                if (!res.ok) {
                    setStatus("error");
                    setMessage(data?.message ?? "Email confirmation failed.");
                    // quan trọng: xóa token khỏi URL ngay cả khi fail
                    router.replace("/confirm-email?error=1");
                    return;
                }

                setStatus("ok");
                setMessage(data?.message ?? "Email confirmed.");

                // quan trọng: replace để token không nằm trong history
                router.replace("/login?confirmed=1");
            } catch {
                setStatus("error");
                setMessage("Network error.");
                router.replace("/confirm-email?error=1");
            }
        })();
    }, [router, sp]);

    return (
        <main style={{ padding: 24 }}>
            <h1>Confirm Email</h1>
            <p>Status: {status}</p>
            <p>{message}</p>
        </main>
    );
}
