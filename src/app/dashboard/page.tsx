"use client";

import { useEffect, useState } from "react";
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

interface ExpenseSummary {
    label: string;
    value: number;
}
interface MonthlyData {
    month: string;
    income: number;
    expense: number;
}

export default function Dashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [activePeriod, setActivePeriod] = useState<string>("");

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    async function load(period?: string, customFrom?: string, customTo?: string) {
        const params = new URLSearchParams();

        if (period) params.set("period", period);
        if (customFrom && customTo) {
            params.set("from", customFrom);
            params.set("to", customTo);
        }

        const url = "/api/transactions" + (params.toString() ? `?${params.toString()}` : "");
        setActivePeriod(period ?? (customFrom && customTo ? "custom" : ""));

        const res = await fetch(url);
        const json = await res.json();
        const data: Transaction[] = json.data ?? json;

        setTransactions(data);
        generateCharts(data);
    }

    function generateCharts(data: Transaction[]) {
        // Pie
        const expenseMap = new Map<string, number>();
        data
            .filter((t) => t.type === "EXPENSE")
            .forEach((t) => {
                const name = t.category?.name ?? "Sem categoria";
                expenseMap.set(name, (expenseMap.get(name) || 0) + t.amount);
            });

        setExpenseSummary(Array.from(expenseMap, ([label, value]) => ({ label, value })));

        // Monthly bar
        const months: Record<string, { income: number; expense: number }> = {};
        data.forEach((t) => {
            const m = new Date(t.date).toLocaleString("pt-BR", { month: "short" });
            if (!months[m]) months[m] = { income: 0, expense: 0 };
            if (t.type === "INCOME") months[m].income += t.amount;
            else months[m].expense += t.amount;
        });

        setMonthlyData(
            Object.entries(months).map(([month, values]) => ({
                month,
                income: values.income,
                expense: values.expense,
            }))
        );
    }

    useEffect(() => {
        void load();
    }, []);

    const totalIncome = transactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    function btnClass(period: string) {
        return `px-3 py-1 border rounded transition ${activePeriod === period ? "bg-green-600 text-white" : "bg-white"
            }`;
    }

    function applyCustom() {
        if (!from || !to) return;
        setActivePeriod("custom");
        void load(undefined, from, to);
    }

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="flex gap-2 items-center">
                <button onClick={() => load("7d")} className={btnClass("7d")}>
                    Últimos 7 dias
                </button>
                <button onClick={() => load("30d")} className={btnClass("30d")}>
                    Últimos 30 dias
                </button>
                <button onClick={() => load("month")} className={btnClass("month")}>
                    Este mês
                </button>
                <button onClick={() => load()} className={btnClass("")}>
                    Limpar filtro
                </button>

                {/* Personalizado */}
                <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border rounded p-1"
                />
                <span>→</span>
                <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="border rounded p-1"
                />
                <button
                    onClick={applyCustom}
                    className={`px-3 py-1 border rounded transition ${activePeriod === "custom" ? "bg-green-600 text-white" : "bg-white"
                        }`}
                >
                    Aplicar
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
                <KpiCard title="Receitas" value={`R$ ${totalIncome.toFixed(2)}`} />
                <KpiCard title="Despesas" value={`R$ ${totalExpense.toFixed(2)}`} />
                <KpiCard title="Saldo" value={`R$ ${balance.toFixed(2)}`} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
                <ExpensesPieChart data={expenseSummary} />
                <IncomeExpenseBarChart data={monthlyData} />
            </div>
        </div>
    );
}
