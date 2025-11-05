"use client";

import { useEffect, useState } from "react";

interface Category {
    id: string;
    name: string;
    type: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [name, setName] = useState("");
    const [type, setType] = useState("INCOME");

    async function load() {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
    }

    async function create() {
        await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, type }),
        });

        setName("");
        void load();
    }

    async function remove(id: string) {
        await fetch("/api/categories", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        void load();
    }

    useEffect(() => {
        (async () => {
            await load();
        })();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold">Categorias</h1>

            <div className="mt-4 flex gap-2">
                <input
                    className="border p-2 rounded"
                    placeholder="Categoria..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <select
                    className="border p-2 rounded"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                </select>

                <button onClick={create} className="bg-green-600 text-white px-4 rounded">
                    Adicionar
                </button>
            </div>

            <table className="mt-6 w-full border text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left">Nome</th>
                        <th className="p-2 text-left">Tipo</th>
                        <th className="p-2">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((cat) => (
                        <tr key={cat.id} className="border-b">
                            <td className="p-2">{cat.name}</td>
                            <td className="p-2">{cat.type}</td>
                            <td className="p-2 text-center">
                                <button
                                    onClick={() => void remove(cat.id)}
                                    className="text-red-500 hover:underline"
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
