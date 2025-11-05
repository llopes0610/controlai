"use client";

import { useEffect, useState } from "react";
import AlmostBurstingCard from "./components/AlmostBurstingCard";
import ExpensesPieChart from "./components/ExpensesPieChart";
import IncomeExpenseBarChart from "./components/IncomeExpenseBarChart";
import KpiCard from "./components/KpiCard";

interface Transaction {
    id: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    date: string;
    category?: { name?: string };
}

interface Goal {
    id: string;
    name: string;
    target: number;
    current: number;
    deadline?: string;
}

export default function Dashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenseSummary, setExpenseSummary] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [almost, setAlmost] = useState<any[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [activePeriod, setActivePeriod] = useState("");

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    // ========================= LOAD =========================
    async function load(period?: string, customFrom?: string, customTo?: string) {
        const params = new URLSearchParams();
        if (period) params.set("period", period);
        if (customFrom && customTo) {
            params.set("from", customFrom);
            params.set("to", customTo);
        }

        const url = "/api/transactions" + (params.toString() ? `?${params}` : "");
        setActivePeriod(period ?? (customFrom && customTo ? "custom" : ""));

        const txRes = await fetch(url);
        const json = await txRes.json();
        const data = json.data ?? json;

        setTransactions(data);
        generateCharts(data);

        // budgets
        const now = new Date();
        const bRes = await fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        const bData = await bRes.json();

        setAlmost(
            bData
                .filter((b: any) => b.percent >= 80)
                .sort((a: any, b: any) => b.percent - a.percent)
                .slice(0, 3)
        );

        // GOALS
        const gRes = await fetch("/api/goals");
        const gData = await gRes.json();
        setGoals(gData);
    }

    // ====================== CHARTS ======================
    function generateCharts(data: Transaction[]) {
        const expenseMap = new Map<string, number>();

        data.filter((t) => t.type === "EXPENSE").forEach((t) => {
            const name = t.category?.name ?? "Sem categoria";
            expenseMap.set(name, (expenseMap.get(name) || 0) + t.amount);
        });

        setExpenseSummary(Array.from(expenseMap, ([label, value]) => ({ label, value })));

        const months: Record<string, { income: number; expense: number }> = {};

        data.forEach((t) => {
            const m = new Date(t.date).toLocaleString("pt-BR", { month: "short" });
            if (!months[m]) months[m] = { income: 0, expense: 0 };
            if (t.type === "INCOME") months[m].income += t.amount;
            else months[m].expense += t.amount;
        });

        setMonthlyData(Object.entries(months).map(([month, values]) => ({
            month,
            income: values.income,
            expense: values.expense,
        })));
    }

    useEffect(() => {
        load();
    }, []);

    // ====================== KPI ======================
    const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // AGG metas (somatório)
    const totalTarget = goals.reduce((s, g) => s + (g.target || 0), 0);
    const totalSaved = goals.reduce((s, g) => s + (g.current || 0), 0);
    const goalPercent = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

    // próximas 3 metas do prazo
    const upcomingGoals = [...goals]
        .filter((g) => g.current < g.target)
        .sort((a, b) => {
            return new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime();
        })
        .slice(0, 3);

    // ====================== UI Helpers ======================
    function btnClass(period: string) {
        return `px-3 py-1 border rounded transition ${activePeriod === period ? "bg-green-600 text-white" : "bg-white"}`;
    }

    function applyCustom() {
        if (!from || !to) return;
        setActivePeriod("custom");
        load(undefined, from, to);
    }

    // ====================== RENDER ======================
    return (
        <div className="space-y-6">

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
                <KpiCard title="Receitas" value={`R$ ${totalIncome.toFixed(2)}`} />
                <KpiCard title="Despesas" value={`R$ ${totalExpense.toFixed(2)}`} />
                <KpiCard title="Saldo" value={`R$ ${balance.toFixed(2)}`} />

                {/* KPI Metas */}
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="text-sm text-gray-500">🐷 Metas</div>
                    <div className="mt-1 text-xl font-semibold">
                        R$ {totalSaved.toFixed(2)} / {`R$ ${totalTarget.toFixed(2)}`}
                    </div>
                    <div className="mt-2 h-2 w-full rounded bg-gray-200">
                        <div
                            className={`h-2 rounded ${goalPercent >= 100
                                    ? "bg-green-600"
                                    : goalPercent >= 70
                                        ? "bg-yellow-500"
                                        : "bg-blue-500"
                                }`}
                            style={{ width: `${goalPercent}%` }}
                        />
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                        {goalPercent.toFixed(0)}% alcançado
                    </div>
                </div>
            </div>

            {/* 3 metas mais urgentes */}
            <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-2">🐷 Próximas metas do prazo</h2>

                {upcomingGoals.length === 0 && (
                    <div className="text-sm text-gray-600">Nenhuma meta pendente :)</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {upcomingGoals.map((g) => {
                        const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
                        const remaining = Math.max(g.target - g.current, 0);
                        let bar = "bg-blue-500";
                        if (pct >= 100) bar = "bg-green-600";
                        else if (pct >= 70) bar = "bg-yellow-500";

                        return (
                            <div className="border rounded-lg p-3 text-sm" key={g.id}>
                                <div className="font-medium">{g.name}</div>
                                <div className="text-xs text-gray-600">
                                    R$ {g.current.toFixed(2)} / R$ {g.target.toFixed(2)}
                                </div>

                                <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                                    <div className={`h-2 rounded ${bar}`} style={{ width: `${pct}%` }}></div>
                                </div>
                                <div className="text-xs mt-1 flex justify-between text-gray-600">
                                    <span>{pct.toFixed(0)}%</span>
                                    <span>Falta: R$ {remaining.toFixed(2)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Charts + budgets warning */}
            <div className="grid grid-cols-3 gap-6">
                <AlmostBurstingCard data={almost} />
                <ExpensesPieChart data={expenseSummary} />
                <IncomeExpenseBarChart data={monthlyData} />
            </div>
        </div>
    );
}
