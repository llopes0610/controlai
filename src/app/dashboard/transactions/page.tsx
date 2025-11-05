"use client";

import { useEffect, useState } from "react";

interface Tx {
    id: string;
    type: string;
    amount: number;
    description?: string;
    date: string;
    category?: { name?: string };
}

export default function TransactionsPage() {
    const [data, setData] = useState<Tx[]>([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const [totalPages, setTotalPages] = useState(1);

    // formulário
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [categories, setCategories] = useState<any[]>([]);

    // modal edição
    const [editing, setEditing] = useState<Tx | null>(null);

    async function load() {
        const res = await fetch(
            `/api/transactions?page=${page}&limit=8&search=${search}&type=${type}`
        );
        const json = await res.json();
        setData(json.data);
        setTotalPages(json.totalPages);
    }

    async function loadCategories() {
        const res = await fetch("/api/categories");
        const json = await res.json();
        setCategories(json);
    }

    async function create() {
        await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                description,
                amount,
                type,
                categoryId,
                date: new Date(),
            }),
        });

        setDescription("");
        setAmount("");
        load();
    }

    async function remove(id: string) {
        if (!confirm("Deseja remover?")) return;
        await fetch("/api/transactions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        load();
    }

    async function saveEdit() {
        await fetch("/api/transactions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editing),
        });
        setEditing(null);
        load();
    }

    useEffect(() => {
        load();
        loadCategories();
    }, [page, type]);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Transações</h1>

            {/* Form */}
            <div className="flex gap-2 mb-4">
                <input placeholder="Descrição" className="border p-2 rounded" value={description} onChange={(e) => setDescription(e.target.value)} />
                <input placeholder="Valor" className="border p-2 rounded" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <select className="border p-2 rounded" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">Tipo</option>
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                </select>
                <select className="border p-2 rounded" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Categoria</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <button onClick={create} className="bg-green-600 text-white px-4 rounded">Adicionar</button>
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-4">
                <input placeholder="Buscar descrição..." className="border p-2 rounded" value={search} onChange={(e) => setSearch(e.target.value)} />
                <button onClick={() => load()} className="border px-3 py-2 rounded">Buscar</button>

                <select className="border p-2 rounded" onChange={(e) => { setType(e.target.value); setPage(1); }}>
                    <option value="">Todos</option>
                    <option value="INCOME">Receitas</option>
                    <option value="EXPENSE">Despesas</option>
                </select>
            </div>

            {/* Table */}
            <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-left">Categoria</th>
                        <th className="p-2 text-left">Tipo</th>
                        <th className="p-2 text-left">Valor</th>
                        <th className="p-2 text-left">Data</th>
                        <th className="p-2 text-left">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((t) => (
                        <tr key={t.id} className="border-b">
                            <td className="p-2">{t.description}</td>
                            <td className="p-2">{t.category?.name}</td>
                            <td className="p-2">{t.type}</td>
                            <td className="p-2">R$ {t.amount.toFixed(2)}</td>
                            <td className="p-2">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                            <td className="p-2 flex gap-2">
                                <button onClick={() => setEditing(t)} className="text-blue-600 hover:underline">Editar</button>
                                <button onClick={() => remove(t.id)} className="text-red-600 hover:underline">Excluir</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Paginação */}
            <div className="flex gap-2 mt-4">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="border px-3 py-1 rounded">
                    ◀ Anterior
                </button>
                <span className="px-3 py-1">Página {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="border px-3 py-1 rounded">
                    Próxima ▶
                </button>
            </div>

            {/* Modal edição */}
            {editing && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow space-y-3 w-[400px]">
                        <h2 className="text-xl font-bold">Editar Transação</h2>

                        <input className="border p-2 rounded w-full"
                            value={editing.description ?? ""}
                            onChange={(e) => setEditing({ ...editing, description: e.target.value })} />

                        <input className="border p-2 rounded w-full"
                            value={editing.amount}
                            onChange={(e) => setEditing({ ...editing, amount: parseFloat(e.target.value) })} />

                        <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded w-full">Salvar</button>
                        <button onClick={() => setEditing(null)} className="bg-gray-300 px-4 py-2 rounded w-full">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
