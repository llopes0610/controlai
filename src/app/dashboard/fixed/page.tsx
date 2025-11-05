"use client";

import { useEffect, useState } from "react";

interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    month: number;
    isPaid: boolean;
    notes?: string;
}

const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export default function FixedBillsPage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDay, setDueDay] = useState(1);
    const [month, setMonth] = useState(new Date().getMonth()); // 0-based UI
    const [notes, setNotes] = useState("");

    async function load() {
        const res = await fetch("/api/fixed");
        const json = await res.json();
        setBills(Array.isArray(json) ? json : []);
    }

    async function create() {
        await fetch("/api/fixed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                amount: Number(amount),
                dueDay,
                month, // 0-based, rota ajusta
                notes,
            }),
        });

        setName("");
        setAmount("");
        setNotes("");

        load();
    }

    async function toggle(id: string, state: boolean) {
        await fetch("/api/fixed", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, isPaid: state }),
        });

        load();
    }

    async function remove(id: string) {
        await fetch("/api/fixed", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        load();
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Contas Fixas</h1>

            <div className="flex flex-wrap gap-2">
                <input
                    className="border p-2 rounded"
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    type="number"
                    className="border p-2 rounded w-24"
                    placeholder="Valor"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />

                <select
                    className="border p-2 rounded"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                >
                    {months.map((m, i) => (
                        <option key={i} value={i}>
                            {m}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    className="border p-2 rounded w-20"
                    placeholder="Dia"
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                />

                <input
                    className="border p-2 rounded w-52"
                    placeholder="Notas"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <button
                    onClick={create}
                    className="bg-green-600 text-white px-4 rounded"
                >
                    Adicionar
                </button>
            </div>

            <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Nome</th>
                        <th className="p-2">Valor</th>
                        <th className="p-2">Mês</th>
                        <th className="p-2">Dia</th>
                        <th className="p-2">Pago?</th>
                        <th className="p-2">Ações</th>
                    </tr>
                </thead>

                <tbody>
                    {bills.map((b) => (
                        <tr key={b.id} className="border-b">
                            <td className="p-2">{b.name}</td>
                            <td className="p-2">R$ {b.amount.toFixed(2)}</td>
                            <td className="p-2">{months[b.month - 1]}</td>
                            <td className="p-2">{b.dueDay}</td>
                            <td className="p-2">{b.isPaid ? "✅" : "❌"}</td>

                            <td className="p-2 flex gap-3">
                                <button
                                    className="text-blue-600"
                                    onClick={() => toggle(b.id, !b.isPaid)}
                                >
                                    Alternar
                                </button>

                                <button
                                    className="text-red-600"
                                    onClick={() => remove(b.id)}
                                >
                                    Remover
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
