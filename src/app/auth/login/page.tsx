"use client";

import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function login() {
        const res = await fetch("/api/auth/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
            window.location.href = "/dashboard";
        } else {
            setError("Credenciais inválidas");
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white shadow p-8 rounded max-w-sm w-full">
                <h1 className="text-2xl font-bold mb-4">Entrar</h1>

                {error && (
                    <div className="bg-red-100 text-red-600 p-2 rounded mb-2 text-sm">
                        {error}
                    </div>
                )}

                <input
                    type="email"
                    placeholder="E-mail"
                    className="border p-2 rounded w-full mb-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Senha"
                    className="border p-2 rounded w-full mb-4"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={login}
                    className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700"
                >
                    Entrar
                </button>

                {/* ✅ Kicker para registro */}
                <button
                    onClick={() => (window.location.href = "/auth/register")}
                    className="mt-4 w-full py-2 border rounded hover:bg-gray-50 text-sm"
                >
                    Criar conta
                </button>
            </div>
        </div>
    );
}
