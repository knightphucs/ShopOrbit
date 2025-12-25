"use client";

import Link from "next/link";
import { useState } from "react";
import { authService } from "../../services/auth.service";

export default function LoginForm() {
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [err, setErr] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        try {
            const res = await authService.login({ username, password });
            alert("LOGIN OK\nTOKEN:\n" + res.token);
        } catch (e: any) {
            setErr(e.message);
        }
    };

    return (
        <>
            <div className="page">
                <form className="card" onSubmit={submit}>
                    <div className="brand">SHOPORBIT</div>
                    <h1 className="title">Sign In</h1>
                    <p className="desc">Save money. Shop smarter.</p>
                    {err && <div className="error">{err}</div>}

                    <div className="field">
                        <label>Username</label>
                        <input
                            placeholder="Enter your username"
                            onChange={e => setU(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            onChange={e => setP(e.target.value)}
                        />
                    </div>

                    <button className="btn">Log In</button>

                    <p className="footer">
                        New customer?{" "}
                        <Link className="link" href="/signup">
                            Create account
                        </Link>
                    </p>
                </form>
            </div>

            <style jsx>{`
                .page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background:
                            radial-gradient(1000px 600px at 20% 10%, rgba(59,130,246,.18), transparent 60%),
                            radial-gradient(1000px 600px at 80% 20%, rgba(99,102,241,.22), transparent 60%),
                            #f8fafc;
                }

                .card {
                    width: 100%;
                    max-width: 480px;
                    padding: 52px;
                    border-radius: 22px;
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 40px 90px rgba(30,64,175,.25);
                    animation: enter .7s ease;
                }

                @keyframes enter {
                    from { opacity: 0; transform: translateY(30px) scale(.97); }
                    to { opacity: 1; transform: none; }
                }

                .brand {
                    font-size: 14px;
                    font-weight: 900;
                    letter-spacing: .25em;
                    color: #2563eb;
                    margin-bottom: 12px;
                }

                .title {
                    font-size: 40px;
                    font-weight: 900;
                    margin: 0;
                    color: #020617;
                }

                .desc {
                    margin: 14px 0 34px;
                    font-size: 18px;
                    color: #475569;
                    line-height: 1.6;
                }

                .field {
                    margin-bottom: 22px;
                }

                .field label {
                    font-size: 15px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 8px;
                    display: block;
                }

                .field input {
                    width: 100%;
                    height: 52px;
                    padding: 0 16px;
                    font-size: 16px;
                    border-radius: 14px;
                    border: 1px solid #c7d2fe;
                    background: #f8fafc;
                    transition: all .25s ease;
                }

                .field input:focus {
                    outline: none;
                    border-color: #2563eb;
                    background: #fff;
                    box-shadow: 0 0 0 5px rgba(37,99,235,.25);
                    transform: translateY(-1px);
                }

                .btn {
                    width: 100%;
                    height: 54px;
                    margin-top: 10px;
                    font-size: 18px;
                    font-weight: 900;
                    border-radius: 16px;
                    border: none;
                    cursor: pointer;
                    color: #fff;
                    background: linear-gradient(90deg,#2563eb,#4f46e5);
                    transition: all .2s ease;
                }

                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 18px 40px rgba(37,99,235,.45);
                }

                .error {
                    margin-bottom: 18px;
                    padding: 14px;
                    border-radius: 14px;
                    background: #fee2e2;
                    color: #991b1b;
                    font-size: 15px;
                    animation: shake .25s ease;
                }

                @keyframes shake {
                    0% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    50% { transform: translateX(4px); }
                    100% { transform: translateX(0); }
                }

                .footer {
                    margin-top: 26px;
                    font-size: 16px;
                    text-align: center;
                    color: #64748b;
                }

                .link {
                    color: #2563eb;
                    font-weight: 900;
                    text-decoration: none;
                }
                .link:hover { text-decoration: underline; }
            `}</style>
        </>
    );
}
