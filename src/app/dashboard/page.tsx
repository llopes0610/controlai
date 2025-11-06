"use client";

import { useEffect, useMemo, useState } from "react";
import AlmostBurstingCard from "./_components/AlmostBurstingCard";
import ExpensesPieChart from "./_components/ExpensesPieChart";
import GoalsProgressCard from "./_components/GoalsProgressCard";
import IncomeExpenseBarChart from "./_components/IncomeExpenseBarChart";
import KpiCard from "./_components/KpiCard";

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
    current: number;
    target: number;
}

interface FixedBill {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    month: number;
}

export default function Dashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenseSummary, setExpenseSummary] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [almost, setAlmost] = useState<any[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);

    async function load() {
        const now = new Date();
        const url = `/api/transactions?period=month`;

        const txRes = await fetch(url);
        const json = await txRes.json();
        const realData: Transaction[] = json.data ?? json;

        // fixed bills → virtual tx
        const fbRes = await fetch(`/api/fixed?month=${now.getMonth() + 1}`);
        const fixedBills: FixedBill[] = await fbRes.json();
        const vtx = fixedBills.map((b) => ({
            id: `fixed-${b.id}`,
            type: "EXPENSE" as const,
            amount: b.amount,
            date: new Date(now.getFullYear(), b.month - 1, b.dueDay).toISOString(),
            category: { name: "Contas Fixas" },
        }));

        const all = [...realData, ...vtx];
        setTransactions(all);
        generateCharts(all);

        // budgets
        const bRes = await fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        const bData = await bRes.json();
        setAlmost(bData);

        // goals
        const gRes = await fetch("/api/goals");
        setGoals(await gRes.json());
    }

    function generateCharts(data: Transaction[]) {
        // Pizza
        const expenseMap = new Map<string, number>();
        data.filter((t) => t.type === "EXPENSE").forEach((t) => {
            const name = t.category?.name ?? "Sem categoria";
            expenseMap.set(name, (expenseMap.get(name) || 0) + t.amount);
        });

        setExpenseSummary(Array.from(expenseMap, ([label, value]) => ({ label, value })));

        // Mensal
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

    useEffect(() => void load(), []);

    const { totalIncome, totalExpense, balance } = useMemo(() => {
        const ti = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
        const te = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
        return { totalIncome: ti, totalExpense: te, balance: ti - te };
    }, [transactions]);

    return (
        <div className="animate-fade-in space-y-6 w-full">

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <KpiCard title="💰 Receitas" value={`R$ ${totalIncome.toFixed(2)}`} />
                <KpiCard title="🔥 Despesas" value={`R$ ${totalExpense.toFixed(2)}`} />
                <KpiCard title="🏦 Saldo" value={`R$ ${balance.toFixed(2)}`} />
                <KpiCard
                    title="📈 Tendência"
                    value={balance > 0 ? "Positiva" : balance === 0 ? "Estável" : "Negativa"}
                />
            </div>

            {/* Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlmostBurstingCard data={almost} />
                <GoalsProgressCard goals={goals} />
            </div>

            {/* Summary Blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="animate-fade-in p-6 bg-white rounded-xl shadow-sm">
                    <h3 className="font-semibold mb-3">💳 Top gastos do período</h3>
                    <p className="text-gray-600 text-sm">Lazer, Contas Fixas</p>
                </div>

                <div className="animate-fade-in p-6 bg-white rounded-xl shadow-sm">
                    <h3 className="font-semibold mb-3">⚠️ Anomalias detectadas</h3>
                    <p className="text-gray-600 text-sm">Nenhuma encontrada.</p>
                </div>

                <div className="animate-fade-in p-6 bg-white rounded-xl shadow-sm">
                    <h3 className="font-semibold mb-3">🤖 Sugestão financeira</h3>
                    <p className="text-gray-600 text-sm">
                        Ótimo mês para investir mais 5% em metas pessoais.
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ExpensesPieChart data={expenseSummary} />
                <IncomeExpenseBarChart data={monthlyData} />
            </div>
        </div>
    );

}
