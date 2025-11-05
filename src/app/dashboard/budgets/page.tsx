"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Category {
    id: string;
    name: string;
}

interface Budget {
    id: string;
    category: Category;
    categoryId: string;
    limit: number;
    month: number;
    year: number;
}

interface TxLight {
    id: string;
    amount: number;
    categoryId: string;
    date: string;
}

function Modal({
    open,
    onClose,
    children,
    title,
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
                <div className="flex items-center justify-between border-b p-4">
                    <h3 className="font-semibold">{title}</h3>
                    <button
                        onClick={onClose}
                        aria-label="Fechar"
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}

export default function BudgetsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<TxLight[]>([]);

    const [categoryId, setCategoryId] = useState("");
    const [limit, setLimit] = useState("");
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // modal editar limite
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Budget | null>(null);
    const [newLimit, setNewLimit] = useState("");

    const load = useCallback(async () => {
        const resBud = await fetch(`/api/budgets?month=${month}&year=${year}`);
        const jsonBud = await resBud.json();
        setBudgets(jsonBud);

        const resCat = await fetch("/api/categories");
        const jsonCat = await resCat.json();
        setCategories(jsonCat);

        const resTx = await fetch("/api/transactions");
        const jsonTx = await resTx.json();
        setTransactions(jsonTx.data ?? jsonTx);
    }, [month, year]);

    useEffect(() => {
        void load();
    }, [load]);

    const create = useCallback(async () => {
        if (!categoryId || !limit) return;
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
        void load();
    }, [categoryId, limit, load, month, year]);

    const remove = useCallback(
        async (id: string) => {
            await fetch("/api/budgets", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            void load();
        },
        [load]
    );

    const openEdit = useCallback((b: Budget) => {
        setEditing(b);
        setNewLimit(String(b.limit));
        setOpen(true);
    }, []);

    const saveEdit = useCallback(async () => {
        if (!editing) return;
        await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                categoryId: editing.categoryId,
                limit: Number(newLimit),
                month: editing.month,
                year: editing.year,
            }),
        });
        setOpen(false);
        setEditing(null);
        void load();
    }, [editing, load, newLimit]);

    // gastos por categoria no mês/ano
    const spentMap = useMemo(() => {
        const map: Record<string, number> = {};
        transactions
            .filter((t) => {
                const d = new Date(t.date);
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            })
            .forEach((t) => {
                map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
            });
        return map;
    }, [month, transactions, year]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Orçamento Mensal</h1>

            {/* Form (stack no mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
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
                    className="border p-2 rounded"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                />

                <input
                    type="number"
                    className="border p-2 rounded"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    min={1}
                    max={12}
                />

                <input
                    type="number"
                    className="border p-2 rounded"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    min={2000}
                    max={3000}
                />

                <button onClick={create} className="bg-green-600 text-white px-4 rounded">
                    Adicionar
                </button>
            </div>

            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
                {budgets.map((b) => {
                    const spent = spentMap[b.categoryId] ?? 0;
                    const percent = Math.min((spent / b.limit) * 100, 100);
                    const remaining = b.limit - spent;

                    let color = "bg-green-500";
                    if (percent >= 70 && percent < 100) color = "bg-yellow-500";
                    if (percent >= 100) color = "bg-red-500";

                    return (
                        <div key={b.id} className="rounded-lg border bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="font-medium">{b.category?.name}</div>
                                <span className="text-xs text-gray-500">
                                    {String(b.month).padStart(2, "0")}/{b.year}
                                </span>
                            </div>

                            <div className="mt-2 text-sm text-gray-600">Limite: R$ {b.limit.toFixed(2)}</div>

                            <div className="mt-3">
                                <div className="w-full bg-gray-200 rounded h-3">
                                    <div className={`${color} h-3 rounded`} style={{ width: `${percent}%` }} />
                                </div>
                                <div className="flex justify-between text-xs text-gray-700 mt-1">
                                    <span>{percent.toFixed(0)}% consumido</span>
                                    <span>Restante: R$ {remaining.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button onClick={() => openEdit(b)} className="px-3 py-2 rounded border text-sm">
                                    Editar limite
                                </button>
                                <button
                                    onClick={() => void remove(b.id)}
                                    className="px-3 py-2 rounded border text-sm text-red-600"
                                >
                                    Remover
                                </button>
                            </div>
                        </div>
                    );
                })}
                {budgets.length === 0 && (
                    <div className="text-sm text-gray-600">Nenhum orçamento cadastrado.</div>
                )}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm border bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">Categoria</th>
                            <th className="p-3 text-left">Limite (R$)</th>
                            <th className="p-3 text-left">Mês</th>
                            <th className="p-3 text-left">Ano</th>
                            <th className="p-3 text-left">Progresso</th>
                            <th className="p-3 text-left">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {budgets.map((b) => {
                            const spent = spentMap[b.categoryId] ?? 0;
                            const percent = Math.min((spent / b.limit) * 100, 100);
                            const remaining = b.limit - spent;

                            let color = "bg-green-500";
                            if (percent >= 70 && percent < 100) color = "bg-yellow-500";
                            if (percent >= 100) color = "bg-red-500";

                            return (
                                <tr key={b.id} className="border-t">
                                    <td className="p-3">{b.category?.name}</td>
                                    <td className="p-3">R$ {b.limit.toFixed(2)}</td>
                                    <td className="p-3">{b.month}</td>
                                    <td className="p-3">{b.year}</td>
                                    <td className="p-3">
                                        <div className="w-full bg-gray-200 rounded h-3">
                                            <div className={`${color} h-3 rounded`} style={{ width: `${percent}%` }} />
                                        </div>
                                        <div className="text-xs text-gray-700 mt-1">
                                            {percent.toFixed(0)}% — Restante: R$ {remaining.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <button onClick={() => openEdit(b)} className="text-blue-600 hover:underline">
                                            Editar limite
                                        </button>
                                        <span className="mx-2">·</span>
                                        <button
                                            onClick={() => void remove(b.id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {budgets.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-3 text-gray-600">
                                    Nenhum orçamento cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal editar limite */}
            <Modal open={open} onClose={() => setOpen(false)} title="Editar limite">
                <div className="space-y-3">
                    <label className="block text-sm">
                        Novo limite (R$)
                        <input
                            className="mt-1 border rounded p-2 w-full"
                            value={newLimit}
                            onChange={(e) => setNewLimit(e.target.value)}
                            type="number"
                        />
                    </label>
                    <div className="flex gap-2 pt-2">
                        <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded">
                            Salvar
                        </button>
                        <button onClick={() => setOpen(false)} className="px-4 py-2 rounded border">
                            Cancelar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
