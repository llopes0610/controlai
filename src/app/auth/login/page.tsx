"use client";

import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin() {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert(error.message);
            return;
        }

        // sincroniza prisma backend
        await fetch("/api/sync-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: data.user!.email!,
                authId: data.user!.id,
            }),
        });

        // 🔥 redirecionamento
        router.push("/dashboard");
    }

    return (
        <div className="flex flex-col w-96 mx-auto mt-20 gap-4">
            <h1 className="text-2xl font-bold">Entrar</h1>

            <input
                className="border p-2 rounded"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                className="border p-2 rounded"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button
                onClick={handleLogin}
                className="bg-green-600 text-white p-2 rounded"
            >
                Entrar
            </button>
        </div>
    );
}
