"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface CategoryLite {
    id: string;
    name: string;
}
interface Tx {
    id: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description?: string;
    date: string;
    category?: { name?: string };
    categoryId?: string;
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

export default function TransactionsPage() {
    const [data, setData] = useState<Tx[]>([]);
    const [categories, setCategories] = useState<CategoryLite[]>([]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [type, setType] = useState<"" | "INCOME" | "EXPENSE">("");

    // form (criar)
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState("");

    // modal (editar/excluir)
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Tx | null>(null);
    const [editDescription, setEditDescription] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editType, setEditType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
    const [editCategoryId, setEditCategoryId] = useState("");

    const loadCategories = useCallback(async () => {
        const res = await fetch("/api/categories");
        const json = await res.json();
        setCategories(json);
    }, []);

    const load = useCallback(async () => {
        const res = await fetch(
            `/api/transactions?page=${page}&limit=8&search=${encodeURIComponent(
                search
            )}&type=${type}`
        );
        const json = await res.json();
        setData(json.data);
        setTotalPages(json.totalPages);
    }, [page, search, type]);

    useEffect(() => {
        void load();
        void loadCategories();
    }, [load, loadCategories]);

    const create = useCallback(async () => {
        if (!type || !categoryId || !amount) return;
        await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                description,
                amount,
                type,
                categoryId,
            }),
        });
        setDescription("");
        setAmount("");
        void load();
    }, [amount, categoryId, description, load, type]);

    const openEdit = useCallback((tx: Tx) => {
        setEditing(tx);
        setEditDescription(tx.description ?? "");
        setEditAmount(String(tx.amount));
        setEditType(tx.type);
        setEditCategoryId((tx as any).categoryId ?? "");
        setOpen(true);
    }, []);

    const saveEdit = useCallback(async () => {
        if (!editing) return;
        await fetch("/api/transactions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editing.id,
                description: editDescription,
                amount: editAmount,
            }),
        });
        setOpen(false);
        setEditing(null);
        void load();
    }, [editAmount, editDescription, editing, load]);

    const remove = useCallback(
        async (id: string) => {
            await fetch("/api/transactions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            setOpen(false);
            setEditing(null);
            void load();
        },
        [load]
    );

    const hasData = useMemo(() => data.length > 0, [data]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Transações</h1>

            {/* Form (stack no mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
                <input
                    placeholder="Descrição"
                    className="border p-2 rounded"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <input
                    placeholder="Valor"
                    className="border p-2 rounded"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />

                <select
                    className="border p-2 rounded"
                    value={type}
                    onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE" | "")}
                >
                    <option value="">Tipo</option>
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                </select>

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

                <button onClick={create} className="bg-green-600 text-white px-4 rounded">
                    Adicionar
                </button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 md:items-center">
                <div className="flex gap-2">
                    <input
                        placeholder="Buscar descrição..."
                        className="border p-2 rounded flex-1"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button onClick={() => void load()} className="border px-3 py-2 rounded">
                        Buscar
                    </button>
                </div>

                <select
                    className="border p-2 rounded"
                    value={type}
                    onChange={(e) => {
                        setType(e.target.value as "INCOME" | "EXPENSE" | "");
                        setPage(1);
                    }}
                >
                    <option value="">Todos</option>
                    <option value="INCOME">Receitas</option>
                    <option value="EXPENSE">Despesas</option>
                </select>

                <div className="flex justify-between md:justify-end gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="border px-3 py-2 rounded disabled:opacity-50"
                    >
                        ◀ Anterior
                    </button>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="border px-3 py-2 rounded disabled:opacity-50"
                    >
                        Próxima ▶
                    </button>
                    <span className="hidden md:inline px-2">Página {page} / {totalPages}</span>
                </div>
            </div>

            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
                {hasData ? (
                    data.map((t) => (
                        <div key={t.id} className="rounded-lg border bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="font-medium">{t.description || "(Sem descrição)"}</div>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded ${t.type === "INCOME" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {t.type === "INCOME" ? "Receita" : "Despesa"}
                                </span>
                            </div>
                            <div className="text-gray-600 mt-1">{t.category?.name ?? "Sem categoria"}</div>
                            <div className="mt-2 flex items-center justify-between">
                                <div className="text-lg font-semibold">
                                    R$ {t.amount.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(t.date).toLocaleDateString("pt-BR")}
                                </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => openEdit(t)}
                                    className="px-3 py-2 rounded border text-sm"
                                >
                                    Gerenciar
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-gray-600">Nenhuma transação encontrada.</div>
                )}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm border bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">Descrição</th>
                            <th className="p-3 text-left">Categoria</th>
                            <th className="p-3 text-left">Tipo</th>
                            <th className="p-3 text-left">Valor</th>
                            <th className="p-3 text-left">Data</th>
                            <th className="p-3 text-left">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((t) => (
                            <tr key={t.id} className="border-t">
                                <td className="p-3">{t.description}</td>
                                <td className="p-3">{t.category?.name}</td>
                                <td className="p-3">{t.type}</td>
                                <td className="p-3">R$ {t.amount.toFixed(2)}</td>
                                <td className="p-3">
                                    {new Date(t.date).toLocaleDateString("pt-BR")}
                                </td>
                                <td className="p-3">
                                    <button onClick={() => openEdit(t)} className="text-blue-600 hover:underline">
                                        Gerenciar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!hasData && (
                            <tr>
                                <td colSpan={6} className="p-3 text-gray-600">
                                    Nenhuma transação encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal editar/excluir */}
            <Modal open={open} onClose={() => setOpen(false)} title="Gerenciar transação">
                <div className="space-y-3">
                    <label className="block text-sm">
                        Descrição
                        <input
                            className="mt-1 border rounded p-2 w-full"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                        />
                    </label>
                    <label className="block text-sm">
                        Valor
                        <input
                            className="mt-1 border rounded p-2 w-full"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                        />
                    </label>
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={saveEdit}
                            className="bg-green-600 text-white px-4 py-2 rounded"
                        >
                            Salvar
                        </button>
                        {editing && (
                            <button
                                onClick={() => void remove(editing.id)}
                                className="text-red-600 px-4 py-2 rounded border"
                            >
                                Excluir
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
