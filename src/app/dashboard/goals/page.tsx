"use client";

import { useEffect, useState } from "react";

interface Goal {
    id: string;
    name: string;
    description?: string;
    target: number;
    current: number;
    deadline?: string;
}

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [target, setTarget] = useState("");
    const [deadline, setDeadline] = useState("");

    async function load() {
        const res = await fetch("/api/goals");
        const json = await res.json();
        setGoals(json);
    }

    async function create() {
        await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                description,
                target: Number(target),
                deadline
            })
        });

        setName("");
        setDescription("");
        setTarget("");
        setDeadline("");

        load();
    }

    async function deposit(id: string) {
        const amount = Number(prompt("Valor para depositar na meta:"));

        if (!amount) return;

        await fetch("/api/goals", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, amount })
        });

        load();
    }

    async function remove(id: string) {
        await fetch("/api/goals", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        });

        load();
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Metas Financeiras</h1>

            <div className="flex gap-2">
                <input
                    placeholder="Nome"
                    className="border p-2 rounded w-40"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    placeholder="Descrição"
                    className="border p-2 rounded w-64"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Valor alvo"
                    className="border p-2 rounded w-32"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                />

                <input
                    type="date"
                    className="border p-2 rounded"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                />

                <button onClick={create} className="bg-green-600 text-white px-4 rounded">
                    Criar
                </button>
            </div>

            <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left">Meta</th>
                        <th className="p-2 text-left">Acumulado</th>
                        <th className="p-2 text-left">Objetivo</th>
                        <th className="p-2 text-left">Progresso</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>

                <tbody>
                    {goals.map((g) => {
                        const percent = Math.min((g.current / g.target) * 100, 100);

                        return (
                            <tr key={g.id} className="border-b">
                                <td className="p-2">{g.name}</td>
                                <td className="p-2">R$ {g.current.toFixed(2)}</td>
                                <td className="p-2">R$ {g.target.toFixed(2)}</td>

                                <td className="p-2">
                                    <div className="w-full bg-gray-200 h-3 rounded">
                                        <div
                                            className={`bg-green-600 h-3 rounded`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs mt-1 text-gray-700">
                                        {percent.toFixed(0)}%
                                    </div>
                                </td>

                                <td className="p-2 flex justify-end gap-2">
                                    <button
                                        onClick={() => deposit(g.id)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Depositar
                                    </button>

                                    <button
                                        onClick={() => remove(g.id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Remover
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
