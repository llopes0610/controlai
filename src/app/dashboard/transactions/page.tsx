"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
    id: string;
    name: string;
    type: "INCOME" | "EXPENSE";
};

type Tx = {
    id: string;
    description?: string | null;
    amount: number; // já vem number do backend
    type: "INCOME" | "EXPENSE";
    date: string; // ISO
    categoryId: string;
    userId: string;
    category?: Category;
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Tx[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // form state
    const [description, setDescription] = useState("");
    const [amountStr, setAmountStr] = useState(""); // string p/ permitir vírgula
    const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
    const [categoryId, setCategoryId] = useState("");
    const [date, setDate] = useState<string>("");

    async function load() {
        const [txRes, catRes] = await Promise.all([
            fetch("/api/transactions", { cache: "no-store" }).then((r) => r.json()),
            fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
        ]);

        setTransactions(txRes);
        setCategories(catRes);
        if (!categoryId && catRes?.length) {
            // se não selecionou ainda, pega a 1ª compatível com o tipo atual
            const first = catRes.find((c: Category) => c.type === type) ?? catRes[0];
            setCategoryId(first?.id ?? "");
        }
        if (!date) {
            setDate(new Date().toISOString().slice(0, 10)); // yyyy-mm-dd
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // quando muda o tipo, seleciona uma categoria do mesmo tipo se possível
    useEffect(() => {
        if (!categories.length) return;
        const match = categories.find((c) => c.type === type);
        if (match) setCategoryId(match.id);
    }, [type, categories]);

    async function create() {
        if (!categoryId) return alert("Escolha uma categoria.");
        if (!amountStr) return alert("Informe um valor.");

        await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                description,
                amount: amountStr.replace(".", "").replace(",", "."), // normaliza BR -> EN
                type,
                categoryId,
                date, // yyyy-mm-dd
            }),
        });

        // limpa form + recarrega
        setDescription("");
        setAmountStr("");
        await load();
    }

    async function remove(id: string) {
        await fetch("/api/transactions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        await load();
    }

    const balance = useMemo(() => {
        return transactions.reduce((acc, t) => {
            return t.type === "INCOME" ? acc + t.amount : acc - t.amount;
        }, 0);
    }, [transactions]);

    const brl = (n: number) =>
        n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div>
            <h1 className="text-2xl font-bold">Transações</h1>

            <div className="mt-2 text-sm text-gray-600">
                Saldo:{" "}
                <span className={balance >= 0 ? "text-green-700" : "text-red-600"}>
                    {brl(balance)}
                </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 items-center">
                <input
                    className="border p-2 rounded"
                    placeholder="Descrição (opcional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <input
                    className="border p-2 rounded w-32"
                    placeholder="Valor"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                />

                <select
                    className="border p-2 rounded"
                    value={type}
                    onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
                >
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                </select>

                <select
                    className="border p-2 rounded"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                >
                    {categories
                        .filter((c) => c.type === type) // mostra só categorias do tipo
                        .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                </select>

                <input
                    className="border p-2 rounded"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />

                <button
                    onClick={create}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                >
                    Adicionar
                </button>
            </div>

            <table className="mt-6 w-full border text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left">Data</th>
                        <th className="p-2 text-left">Categoria</th>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-right">Valor</th>
                        <th className="p-2 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b">
                            <td className="p-2">{tx.date?.slice(0, 10)}</td>
                            <td className="p-2">{tx.category?.name}</td>
                            <td className="p-2">{tx.description}</td>
                            <td className="p-2 text-right">
                                {tx.type === "EXPENSE" ? "-" : ""}
                                {brl(Math.abs(tx.amount))}
                            </td>
                            <td className="p-2 text-center">
                                <button
                                    onClick={() => remove(tx.id)}
                                    className="text-red-500 hover:underline"
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}

                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-4 text-center text-gray-500">
                                Nenhuma transação ainda.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
