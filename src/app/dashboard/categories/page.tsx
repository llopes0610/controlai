"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Category {
    id: string;
    name: string;
    type: "INCOME" | "EXPENSE";
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [name, setName] = useState("");
    const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");

    const load = useCallback(async () => {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
    }, []);

    const create = useCallback(async () => {
        if (!name) return;
        await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, type }),
        });
        setName("");
        void load();
    }, [load, name, type]);

    const remove = useCallback(
        async (id: string) => {
            await fetch("/api/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            void load();
        },
        [load]
    );

    useEffect(() => {
        void load();
    }, [load]);

    const hasData = useMemo(() => categories.length > 0, [categories]);

    return (
        <div>
            <h1 className="text-2xl font-bold">Categorias</h1>

            {/* Form (stack no mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 mt-4">
                <input
                    className="border p-2 rounded"
                    placeholder="Categoria..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <select
                    className="border p-2 rounded"
                    value={type}
                    onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
                >
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                </select>

                <button onClick={create} className="bg-green-600 text-white px-4 rounded">
                    Adicionar
                </button>
            </div>

            {/* Mobile: cards */}
            <div className="sm:hidden space-y-3 mt-6">
                {categories.map((cat) => (
                    <div key={cat.id} className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="font-medium">{cat.name}</div>
                            <span
                                className={`text-xs px-2 py-0.5 rounded ${cat.type === "INCOME"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                            >
                                {cat.type === "INCOME" ? "Receita" : "Despesa"}
                            </span>
                        </div>

                        <div className="mt-3">
                            <button
                                onClick={() => void remove(cat.id)}
                                className="text-red-600 hover:underline text-sm"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                ))}
                {!hasData && (
                    <div className="text-sm text-gray-600">Nenhuma categoria cadastrada.</div>
                )}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden sm:block overflow-x-auto mt-6">
                <table className="w-full text-sm border bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">Nome</th>
                            <th className="p-3 text-left">Tipo</th>
                            <th className="p-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat) => (
                            <tr key={cat.id} className="border-t">
                                <td className="p-3">{cat.name}</td>
                                <td className="p-3">{cat.type}</td>
                                <td className="p-3 text-center">
                                    <button
                                        onClick={() => void remove(cat.id)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!hasData && (
                            <tr>
                                <td colSpan={3} className="p-3 text-gray-600">
                                    Nenhuma categoria cadastrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
