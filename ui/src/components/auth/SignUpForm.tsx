// src/app/components/auth/SignUpForm.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { authService } from "../../services/auth.service";

type Stage = "form" | "pending" | "confirmed";

export default function SignUpForm() {
    const sp = useSearchParams();
    const confirmed = sp.get("confirmed") === "1";
    const confirmedEmail = sp.get("email") ?? "";

    const [stage, setStage] = useState<Stage>(confirmed ? "confirmed" : "form");

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState(confirmedEmail);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const canSubmit = useMemo(() => {
        if (stage !== "form") return false;
        return (
            fullName.trim().length > 0 &&
            username.trim().length > 0 &&
            email.trim().length > 0 &&
            password.length > 0 &&
            confirmPassword.length > 0 &&
            !loading
        );
    }, [stage, fullName, username, email, password, confirmPassword, loading]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setInfo(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const res = await authService.register({
                fullName: fullName.trim(),
                username: username.trim(),
                email: email.trim(),
                password,
            });

            setStage("pending");
            setInfo(
                res?.message ??
                res?.Message ??
                "Account created. Please check your email to verify your account."
            );
        } catch (err: any) {
            setError(err?.message ?? "Unable to create account.");
        } finally {
            setLoading(false);
        }
    };

    const goLoginHref = `/login${email ? `?email=${encodeURIComponent(email)}` : ""}`;

    return (
        <>
            <div className="page">
                <section className="card">
                    <header className="header">
                        <div className="brand">ShopOrbit</div>
                        <h1 className="title">Create account</h1>
                        <p className="subtitle">
                            Register once to purchase and save deals.
                        </p>
                    </header>

                    {error && (
                        <div className="notice error" role="alert">
                            {error}
                        </div>
                    )}
                    {info && (
                        <div className="notice info" role="status">
                            {info}
                        </div>
                    )}

                    {stage === "confirmed" && (
                        <div className="panel">
                            <div className="panelTitle">Email confirmed</div>
                            <div className="panelText">
                                Your email{confirmedEmail ? ` (${confirmedEmail})` : ""} has been verified.
                                Would you like to continue to sign in now?
                            </div>

                            <div className="actions">
                                <Link
                                    className="btn"
                                    href={`/login?confirmed=1${
                                        confirmedEmail ? `&email=${encodeURIComponent(confirmedEmail)}` : ""
                                    }`}
                                >
                                    Go to sign in
                                </Link>
                                <Link className="btnGhost" href="/signup">
                                    Stay here
                                </Link>
                            </div>

                            <div className="row single">
                                <Link className="link strong" href="/login">
                                    Sign in instead
                                </Link>
                            </div>
                        </div>
                    )}

                    {stage === "pending" && (
                        <div className="panel">
                            <div className="panelTitle">Check your email</div>
                            <div className="panelText">
                                We sent a verification link to <b>{email || "your inbox"}</b>. Open the link
                                to confirm your account, then return to sign in.
                            </div>

                            <div className="actions">
                                <Link className="btn" href={goLoginHref}>
                                    Go to sign in
                                </Link>
                                <button
                                    type="button"
                                    className="btnGhost"
                                    onClick={() => {
                                        setStage("form");
                                        setError(null);
                                        setInfo(null);
                                    }}
                                >
                                    Edit details
                                </button>
                            </div>
                        </div>
                    )}

                    {stage === "form" && (
                        <form onSubmit={submit} className="form">
                            <div className="field">
                                <label className="label" htmlFor="fullName">
                                    Full name
                                </label>
                                <input
                                    id="fullName"
                                    className="input"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label className="label" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    className="input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="john_doe"
                                    autoComplete="username"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label className="label" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    className="input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@email.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label className="label" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    className="input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 8 characters"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label className="label" htmlFor="confirmPassword">
                                    Confirm password
                                </label>
                                <input
                                    id="confirmPassword"
                                    className="input"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>

                            <button className="btn" type="submit" disabled={!canSubmit}>
                                {loading ? "Creating account..." : "Create account"}
                            </button>

                            <div className="row">
                                <Link className="link strong" href="/login">
                                    Already have an account? Sign in
                                </Link>
                            </div>
                        </form>
                    )}
                </section>
            </div>

            <style jsx>{`
                :global(html),
                :global(body) {
                    height: 100%;
                }

                .page {
                    min-height: 100vh;
                    display: grid;
                    place-items: center;
                    padding: 40px 16px;
                    background:
                            radial-gradient(1200px 700px at 12% 12%, rgba(11, 92, 255, 0.16), transparent 60%),
                            radial-gradient(900px 520px at 88% 24%, rgba(37, 99, 235, 0.14), transparent 62%),
                            radial-gradient(780px 520px at 50% 95%, rgba(2, 132, 199, 0.10), transparent 60%),
                            linear-gradient(180deg, #f7faff 0%, #f6f8ff 40%, #f7fafc 100%);
                }

                .card {
                    width: 100%;
                    max-width: 520px;
                    background: rgba(255, 255, 255, 0.92);
                    border: 1px solid rgba(15, 23, 42, 0.10);
                    border-radius: 20px;
                    padding: 22px 22px 18px;
                    box-shadow:
                            0 34px 86px rgba(2, 6, 23, 0.14),
                            0 10px 22px rgba(2, 6, 23, 0.06);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    animation: cardEnter 520ms cubic-bezier(0.2, 0.85, 0.2, 1);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                /* subtle “top highlight” like premium UI */
                .card::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(1200px 220px at 50% 0%, rgba(11, 92, 255, 0.10), transparent 60%);
                    pointer-events: none;
                }

                @keyframes cardEnter {
                    from {
                        opacity: 0;
                        transform: translateY(18px) scale(0.985);
                        filter: blur(2px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                        filter: blur(0);
                    }
                }

                .header {
                    margin-bottom: 14px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
                    position: relative;
                    z-index: 1;
                }

                .brand {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 950;
                    letter-spacing: 0.34px;
                    color: #0b5cff;
                    font-size: 12px;
                    text-transform: uppercase;
                    position: relative;
                    padding-left: 14px;
                }

                .brand::before {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 50%;
                    width: 8px;
                    height: 8px;
                    border-radius: 999px;
                    transform: translateY(-50%);
                    background: #0b5cff;
                    box-shadow: 0 0 0 7px rgba(11, 92, 255, 0.14);
                }

                .title {
                    margin: 10px 0 6px;
                    font-size: 40px;
                    font-weight: 950;
                    letter-spacing: -0.035em;
                    color: #0b1220;
                    line-height: 1.06;
                }

                .subtitle {
                    margin: 0;
                    color: rgba(51, 65, 85, 0.92);
                    font-size: 16.5px;
                    line-height: 1.7;
                    font-weight: 650;
                    max-width: 46ch;
                }

                .notice {
                    border-radius: 14px;
                    padding: 10px 12px;
                    margin: 12px 0;
                    font-size: 14px;
                    border: 1px solid;
                    animation: pop 220ms ease-out;
                    box-shadow: 0 12px 24px rgba(2, 6, 23, 0.06);
                    position: relative;
                    z-index: 1;
                }

                @keyframes pop {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .notice.error {
                    background: rgba(254, 242, 242, 0.92);
                    border-color: rgba(239, 68, 68, 0.24);
                    color: #991b1b;
                }

                .notice.info {
                    background: rgba(239, 246, 255, 0.92);
                    border-color: rgba(59, 130, 246, 0.22);
                    color: #1e3a8a;
                }

                .form {
                    margin-top: 12px;
                    position: relative;
                    z-index: 1;
                }

                .field {
                    display: grid;
                    gap: 7px;
                    margin-bottom: 12px;
                }

                .label {
                    font-size: 13.5px;
                    font-weight: 900;
                    color: #0b1220;
                    letter-spacing: 0.02em;
                }

                .input {
                    height: 50px;
                    padding: 0 14px;
                    border-radius: 14px;
                    border: 1px solid rgba(11, 92, 255, 0.18);
                    font-size: 16px;
                    outline: none;
                    background: rgba(248, 250, 252, 0.92);
                    color: #0b1220;
                    transition:
                            border-color 180ms ease,
                            box-shadow 180ms ease,
                            transform 120ms ease,
                            background 180ms ease;
                }

                .input::placeholder {
                    color: rgba(71, 85, 105, 0.75);
                    font-weight: 650;
                }

                .input:hover {
                    border-color: rgba(11, 92, 255, 0.28);
                    background: rgba(255, 255, 255, 0.96);
                }

                .input:focus {
                    border-color: rgba(11, 92, 255, 0.72);
                    box-shadow:
                            0 0 0 4px rgba(11, 92, 255, 0.14),
                            0 16px 34px rgba(2, 6, 23, 0.06);
                    transform: translateY(-1px);
                    background: rgba(255, 255, 255, 0.98);
                }

                :global(input:-webkit-autofill),
                :global(input:-webkit-autofill:hover),
                :global(input:-webkit-autofill:focus) {
                    -webkit-text-fill-color: #0b1220;
                    -webkit-box-shadow: 0 0 0px 1000px rgba(248, 250, 252, 0.96) inset;
                    transition: background-color 9999s ease-in-out 0s;
                    caret-color: #0b1220;
                    border: 1px solid rgba(11, 92, 255, 0.22);
                }

                .btn {
                    width: 100%;
                    height: 50px;
                    margin-top: 10px;
                    border-radius: 14px;
                    border: 1px solid rgba(11, 92, 255, 0.28);
                    background: #0b5cff; /* solid, premium, clear */
                    color: #fff;
                    font-weight: 950;
                    font-size: 16.5px;
                    cursor: pointer;
                    transition:
                            transform 120ms ease,
                            box-shadow 180ms ease,
                            filter 180ms ease,
                            background 180ms ease;
                    box-shadow:
                            0 20px 40px rgba(11, 92, 255, 0.22),
                            0 8px 16px rgba(2, 6, 23, 0.05);
                    position: relative;
                    overflow: hidden;
                }

                /* very subtle sheen, not flashy */
                .btn::after {
                    content: "";
                    position: absolute;
                    inset: -2px;
                    transform: translateX(-60%) skewX(-18deg);
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent);
                    opacity: 0;
                    transition: transform 520ms ease, opacity 220ms ease;
                }

                .btn:hover::after {
                    opacity: 1;
                    transform: translateX(60%) skewX(-18deg);
                }

                .btn:hover {
                    background: #0a56ee;
                    box-shadow:
                            0 26px 52px rgba(11, 92, 255, 0.26),
                            0 10px 18px rgba(2, 6, 23, 0.06);
                    transform: translateY(-1px);
                    filter: saturate(1.02);
                }

                .btn:active {
                    transform: translateY(1px);
                    box-shadow:
                            0 16px 34px rgba(11, 92, 255, 0.20),
                            0 8px 14px rgba(2, 6, 23, 0.05);
                }

                .btn:disabled {
                    opacity: 0.58;
                    cursor: not-allowed;
                    box-shadow: none;
                    transform: none;
                    filter: none;
                }

                .btnGhost {
                    width: 100%;
                    height: 50px;
                    margin-top: 10px;
                    border-radius: 14px;
                    border: 1px solid rgba(15, 23, 42, 0.14);
                    background: rgba(255, 255, 255, 0.94);
                    color: #0b1220;
                    font-weight: 900;
                    font-size: 15.5px;
                    cursor: pointer;
                    transition:
                            border-color 180ms ease,
                            color 180ms ease,
                            transform 120ms ease,
                            box-shadow 180ms ease,
                            background 180ms ease;
                    box-shadow: 0 12px 24px rgba(2, 6, 23, 0.06);
                }

                .btnGhost:hover {
                    border-color: rgba(11, 92, 255, 0.38);
                    color: #0b5cff;
                    background: rgba(248, 250, 252, 0.98);
                    transform: translateY(-1px);
                    box-shadow: 0 16px 30px rgba(2, 6, 23, 0.08);
                }

                .btnGhost:active {
                    transform: translateY(1px);
                }

                .row {
                    margin-top: 14px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(15, 23, 42, 0.08);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    align-items: center;
                    font-size: 14px;
                    position: relative;
                    z-index: 1;
                }

                .row.single {
                    justify-content: flex-end;
                    border-top: none;
                    padding-top: 0;
                    margin-top: 12px;
                }

                .muted {
                    color: rgba(71, 85, 105, 0.86);
                    font-weight: 750;
                }

                .link {
                    color: #0b5cff;
                    text-decoration: none;
                    font-weight: 950;
                    position: relative;
                }

                .link::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    bottom: -3px;
                    width: 100%;
                    height: 2px;
                    background: rgba(11, 92, 255, 0.35);
                    transform: scaleX(0);
                    transform-origin: left;
                    transition: transform 180ms ease;
                }

                .link:hover::after {
                    transform: scaleX(1);
                }

                .strong {
                    font-weight: 950;
                }

                .panel {
                    border: 1px solid rgba(15, 23, 42, 0.10);
                    border-radius: 16px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.94);
                    box-shadow: 0 18px 38px rgba(2, 6, 23, 0.07);
                    animation: panelEnter 380ms cubic-bezier(0.2, 0.85, 0.2, 1);
                    position: relative;
                    z-index: 1;
                }

                @keyframes panelEnter {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .panelTitle {
                    font-size: 18px;
                    font-weight: 950;
                    margin-bottom: 6px;
                    color: #0b1220;
                    letter-spacing: -0.01em;
                }

                .panelText {
                    color: rgba(51, 65, 85, 0.95);
                    font-size: 15px;
                    line-height: 1.75;
                    font-weight: 650;
                }

                .actions {
                    margin-top: 14px;
                    display: grid;
                    gap: 10px;
                }

                @media (max-width: 420px) {
                    .card {
                        padding: 18px 16px 16px;
                        border-radius: 18px;
                    }
                    .title {
                        font-size: 34px;
                    }
                    .input, .btn, .btnGhost {
                        height: 48px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .card,
                    .panel,
                    .notice {
                        animation: none !important;
                    }
                    .btn,
                    .btnGhost,
                    .input,
                    .link::after {
                        transition: none !important;
                    }
                }
            `}</style>
        </>
    );
}
