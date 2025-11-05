"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Goal {
    id: string;
    name: string;
    description?: string;
    target: number;
    current: number;
    deadline?: string | null;
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

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [target, setTarget] = useState("");
    const [deadline, setDeadline] = useState("");

    // modal depósito
    const [open, setOpen] = useState(false);
    const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
    const [depositAmount, setDepositAmount] = useState("");

    const load = useCallback(async () => {
        const res = await fetch("/api/goals");
        const json = await res.json();
        setGoals(json);
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const create = useCallback(async () => {
        await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                description,
                target: Number(target),
                deadline,
            }),
        });

        setName("");
        setDescription("");
        setTarget("");
        setDeadline("");
        void load();
    }, [deadline, description, load, name, target]);

    const openDeposit = useCallback((g: Goal) => {
        setDepositGoal(g);
        setDepositAmount("");
        setOpen(true);
    }, []);

    const saveDeposit = useCallback(async () => {
        if (!depositGoal || !depositAmount) return;
        await fetch("/api/goals", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: depositGoal.id, amount: Number(depositAmount) }),
        });
        setOpen(false);
        setDepositGoal(null);
        setDepositAmount("");
        void load();
    }, [depositAmount, depositGoal, load]);

    const remove = useCallback(
        async (id: string) => {
            await fetch("/api/goals", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            void load();
        },
        [load]
    );

    const hasGoals = useMemo(() => goals.length > 0, [goals]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Metas Financeiras</h1>

            {/* Form (stack no mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
                <input
                    placeholder="Nome"
                    className="border p-2 rounded"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <input
                    placeholder="Descrição"
                    className="border p-2 rounded"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Valor alvo"
                    className="border p-2 rounded"
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

            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
                {goals.map((g) => {
                    const percent = Math.min((g.current / g.target) * 100, 100);

                    return (
                        <div key={g.id} className="rounded-lg border bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="font-medium">{g.name}</div>
                                {g.deadline && (
                                    <span className="text-xs text-gray-500">
                                        até {new Date(g.deadline).toLocaleDateString("pt-BR")}
                                    </span>
                                )}
                            </div>

                            <div className="mt-2 text-sm text-gray-600">
                                R$ {g.current.toFixed(2)} / R$ {g.target.toFixed(2)}
                            </div>

                            <div className="mt-3">
                                <div className="w-full bg-gray-200 rounded h-3">
                                    <div className="bg-green-600 h-3 rounded" style={{ width: `${percent}%` }} />
                                </div>
                                <div className="text-xs mt-1 text-gray-700">{percent.toFixed(0)}%</div>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button onClick={() => openDeposit(g)} className="px-3 py-2 rounded border text-sm">
                                    Depositar
                                </button>
                                <button
                                    onClick={() => void remove(g.id)}
                                    className="px-3 py-2 rounded border text-sm text-red-600"
                                >
                                    Remover
                                </button>
                            </div>
                        </div>
                    );
                })}
                {!hasGoals && <div className="text-sm text-gray-600">Nenhuma meta cadastrada.</div>}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm border bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">Meta</th>
                            <th className="p-3 text-left">Acumulado</th>
                            <th className="p-3 text-left">Objetivo</th>
                            <th className="p-3 text-left">Progresso</th>
                            <th className="p-3 text-left">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {goals.map((g) => {
                            const percent = Math.min((g.current / g.target) * 100, 100);
                            return (
                                <tr key={g.id} className="border-t">
                                    <td className="p-3">{g.name}</td>
                                    <td className="p-3">R$ {g.current.toFixed(2)}</td>
                                    <td className="p-3">R$ {g.target.toFixed(2)}</td>
                                    <td className="p-3">
                                        <div className="w-full bg-gray-200 rounded h-3">
                                            <div className="bg-green-600 h-3 rounded" style={{ width: `${percent}%` }} />
                                        </div>
                                        <div className="text-xs text-gray-700 mt-1">{percent.toFixed(0)}%</div>
                                    </td>
                                    <td className="p-3">
                                        <button onClick={() => openDeposit(g)} className="text-blue-600 hover:underline">
                                            Depositar
                                        </button>
                                        <span className="mx-2">·</span>
                                        <button
                                            onClick={() => void remove(g.id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {!hasGoals && (
                            <tr>
                                <td colSpan={5} className="p-3 text-gray-600">
                                    Nenhuma meta cadastrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal depósito */}
            <Modal open={open} onClose={() => setOpen(false)} title="Depositar na meta">
                <div className="space-y-3">
                    <label className="block text-sm">
                        Valor do depósito (R$)
                        <input
                            className="mt-1 border rounded p-2 w-full"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            type="number"
                            min="0"
                        />
                    </label>
                    <div className="flex gap-2 pt-2">
                        <button onClick={saveDeposit} className="bg-green-600 text-white px-4 py-2 rounded">
                            Confirmar
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
