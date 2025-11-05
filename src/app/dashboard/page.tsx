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

export default function Dashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenseSummary, setExpenseSummary] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [almost, setAlmost] = useState<any[]>([]);
    const [activePeriod, setActivePeriod] = useState("");

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

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

        // budgets warning
        const now = new Date();
        const bRes = await fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        const bData = await bRes.json();

        setAlmost(
            bData
                .filter((b: any) => b.percent >= 80)
                .sort((a: any, b: any) => b.percent - a.percent)
                .slice(0, 3)
        );
    }

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

    const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    function btnClass(period: string) {
        return `px-3 py-1 border rounded transition ${activePeriod === period ? "bg-green-600 text-white" : "bg-white"}`;
    }

    function applyCustom() {
        if (!from || !to) return;
        setActivePeriod("custom");
        load(undefined, from, to);
    }

    return (
        <div className="space-y-6">

            {/* filtros - já prontos */}

            <div className="grid grid-cols-3 gap-4">
                <KpiCard title="Receitas" value={`R$ ${totalIncome.toFixed(2)}`} />
                <KpiCard title="Despesas" value={`R$ ${totalExpense.toFixed(2)}`} />
                <KpiCard title="Saldo" value={`R$ ${balance.toFixed(2)}`} />
            </div>

            <div className="grid grid-cols-3 gap-6">
                <AlmostBurstingCard data={almost} />
                <ExpensesPieChart data={expenseSummary} />
                <IncomeExpenseBarChart data={monthlyData} />
            </div>
        </div>
    );
}
