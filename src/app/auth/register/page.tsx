"use client";

import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleRegister() {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            alert(error.message);
            return;
        }

        if (data.user) {
            await fetch("/api/sync-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: data.user.email!,
                    authId: data.user.id,
                }),
            });

            alert("Conta criada com sucesso!");
            router.push("/dashboard");
        }
    }

    return (
        <div className="flex flex-col w-96 mx-auto mt-20 gap-4">
            <h1 className="text-2xl font-bold">Criar Conta</h1>
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
                onClick={handleRegister}
                className="bg-blue-500 text-white p-2 rounded"
            >
                Registrar
            </button>
        </div>
    );
}
