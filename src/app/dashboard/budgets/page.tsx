"use client";

import { useEffect, useState } from "react";

interface Category {
    id: string;
    name: string;
}

interface Budget {
    id: string;
    category: Category;
    limit: number;
    month: number;
    year: number;
    spent?: number;
    percent?: number;
    categoryId: string;
}

export default function BudgetsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);

    const [categoryId, setCategoryId] = useState("");
    const [limit, setLimit] = useState("");
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    async function load() {
        const resBud = await fetch(`/api/budgets?month=${month}&year=${year}`);
        const jsonBud = await resBud.json();
        setBudgets(jsonBud);

        const resCat = await fetch("/api/categories");
        const jsonCat = await resCat.json();
        setCategories(jsonCat);
    }

    async function create() {
        await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                categoryId,
                limit: Number(limit),
                month,
                year,
            }),
        });

        setLimit("");
        load();
    }

    async function remove(id: string) {
        await fetch("/api/budgets", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        load();
    }

    useEffect(() => {
        load();
    }, [month, year]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Orçamento Mensal</h1>

            {/* Form */}
            <div className="flex gap-2">
                <select
                    className="border p-2 rounded"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                >
                    <option value="">Categoria</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Limite"
                    className="border p-2 rounded w-32"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                />

                <input
                    type="number"
                    className="border p-2 rounded w-20"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                />

                <input
                    type="number"
                    className="border p-2 rounded w-28"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                />

                <button onClick={create} className="bg-green-600 text-white px-4 rounded">
                    Adicionar
                </button>
            </div>

            {/* Table */}
            <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left">Categoria</th>
                        <th className="p-2 text-left">Limite (R$)</th>
                        <th className="p-2 text-left">Mês</th>
                        <th className="p-2 text-left">Ano</th>
                        <th className="p-2 text-left">Progresso</th>
                        <th className="p-2">Ações</th>
                    </tr>
                </thead>

                <tbody>
                    {budgets.map((b) => {
                        const spent = b.spent ?? 0;
                        const percent = Math.min((spent / b.limit) * 100, 100);

                        let color = "bg-green-500";
                        if (percent >= 80 && percent < 100) color = "bg-yellow-500";
                        if (percent >= 100) color = "bg-red-600";

                        return (
                            <tr key={b.id} className="border-b">
                                <td className="p-2">{b.category?.name}</td>
                                <td className="p-2">R$ {b.limit.toFixed(2)}</td>
                                <td className="p-2">{b.month}</td>
                                <td className="p-2">{b.year}</td>

                                <td className="p-2">
                                    <div className="w-full bg-gray-200 rounded h-3">
                                        <div
                                            className={`${color} h-3 rounded`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>

                                    <div className="text-xs mt-1 text-gray-700">
                                        ✅ {percent.toFixed(0)}% consumido
                                    </div>

                                    <div className="text-xs text-gray-700">
                                        💰 Restante: R$ {(b.limit - spent).toFixed(2)}
                                    </div>
                                </td>

                                <td className="p-2 text-center">
                                    <button
                                        onClick={() => remove(b.id)}
                                        className="text-red-500 hover:underline"
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
