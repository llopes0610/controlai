"use client";

import { useEffect, useMemo, useState } from "react";
import AlmostBurstingCard from "./components/AlmostBurstingCard";
import ExpensesPieChart from "./components/ExpensesPieChart";
import GoalsProgressCard from "./components/GoalsProgressCard";
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
    current: number;
    target: number;
}

interface FixedBill {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    month: number;
    // isPaid, notes, etc (não usados para o dashboard)
}

type PeriodKey = "" | "7d" | "30d" | "month" | "custom";

export default function Dashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [expenseSummary, setExpenseSummary] = useState<{ label: string; value: number }[]>([]);
    const [monthlyData, setMonthlyData] = useState<{ month: string; income: number; expense: number }[]>(
        []
    );
    const [almost, setAlmost] = useState<any[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [activePeriod, setActivePeriod] = useState<PeriodKey>("");

    // filtros por data custom
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    // ===== Helpers de datas para filtrar contas fixas no mesmo range =====
    function computeRange(period?: PeriodKey, customFrom?: string, customTo?: string) {
        const now = new Date();
        let start = new Date(now);
        let end = new Date(now);

        if (period === "7d") {
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === "30d") {
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (period === "month") {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === "custom" && customFrom && customTo) {
            start = new Date(customFrom);
            end = new Date(customTo);
        } else {
            // default: mês atual
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        // normaliza hora
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    // busca contas fixas dos meses que caem no range
    async function fetchFixedBillsForRange(start: Date, end: Date): Promise<FixedBill[]> {
        const months = new Set<number>();
        const temp = new Date(start);

        // percorre mês a mês até o fim do range
        temp.setDate(1);
        const limit = 24; // trava de segurança
        let safety = 0;
        while (temp <= end && safety < limit) {
            months.add(temp.getMonth() + 1);
            temp.setMonth(temp.getMonth() + 1);
            safety++;
        }

        // busca por mês (o schema tem apenas 'month', sem 'year')
        const promises = Array.from(months).map((m) => fetch(`/api/fixed?month=${m}`).then((r) => r.json()));
        const results = await Promise.all(promises);
        // concatena e elimina duplicatas por id
        const merged: Record<string, FixedBill> = {};
        results.flat().forEach((b: FixedBill) => (merged[b.id] = b));
        return Object.values(merged);
    }

    // transforma FixedBill em "transações virtuais" para os KPIs/gráficos
    function fixedToVirtualTx(bills: FixedBill[], start: Date, end: Date): Transaction[] {
        const year = new Date().getFullYear(); // não temos 'year' no schema, usamos o atual
        return bills
            .map((b) => {
                const due = new Date(year, b.month - 1, Math.min(b.dueDay || 1, 28)); // evita inválidos
                return {
                    id: `fixed-${b.id}`,
                    type: "EXPENSE" as const,
                    amount: b.amount,
                    date: due.toISOString(),
                    category: { name: "Contas Fixas" }, // agregado em uma categoria só
                };
            })
            .filter((tx) => {
                const d = new Date(tx.date);
                return d >= start && d <= end; // respeita o range do filtro
            });
    }

    async function load(period?: PeriodKey, customFrom?: string, customTo?: string) {
        const params = new URLSearchParams();
        if (period && period !== "custom") params.set("period", period);
        if (period === "custom" && customFrom && customTo) {
            params.set("from", customFrom);
            params.set("to", customTo);
        }

        // define período ativo
        setActivePeriod(period ?? (customFrom && customTo ? "custom" : ""));

        // range final aplicado para contas fixas
        const { start, end } = computeRange(period, customFrom, customTo);

        // transações "reais"
        const url = "/api/transactions" + (params.toString() ? `?${params}` : "");
        const txRes = await fetch(url);
        const json = await txRes.json();
        const realData: Transaction[] = json.data ?? json;

        // contas fixas -> transações virtuais
        const fixedBills = await fetchFixedBillsForRange(start, end);
        const virtualTx = fixedToVirtualTx(fixedBills, start, end);

        // mescla p/ o dashboard
        const all = [...realData, ...virtualTx];
        setTransactions(all);
        generateCharts(all);

        // warnings (budgets) — já existia
        const now = new Date();
        const bRes = await fetch(
            `/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
        );
        const bData = await bRes.json();
        setAlmost(
            (bData || [])
                .filter((b: any) => b.percent >= 80)
                .sort((a: any, b: any) => b.percent - a.percent)
                .slice(0, 3)
        );

        // metas
        const gRes = await fetch("/api/goals");
        const gData = await gRes.json();
        setGoals(gData || []);
    }

    function generateCharts(data: Transaction[]) {
        // Pizza por categoria (inclui "Contas Fixas")
        const expenseMap = new Map<string, number>();
        data
            .filter((t) => t.type === "EXPENSE")
            .forEach((t) => {
                const name = t.category?.name ?? "Sem categoria";
                expenseMap.set(name, (expenseMap.get(name) || 0) + t.amount);
            });

        setExpenseSummary(Array.from(expenseMap, ([label, value]) => ({ label, value })));

        // Barras: receita x despesa por mês
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

    const { totalIncome, totalExpense, balance } = useMemo(() => {
        const ti = transactions
            .filter((t) => t.type === "INCOME")
            .reduce((s, t) => s + t.amount, 0);
        const te = transactions
            .filter((t) => t.type === "EXPENSE")
            .reduce((s, t) => s + t.amount, 0);
        return { totalIncome: ti, totalExpense: te, balance: ti - te };
    }, [transactions]);

    return (
        <div className="space-y-6">
            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard title="Receitas" value={`R$ ${totalIncome.toFixed(2)}`} />
                <KpiCard title="Despesas" value={`R$ ${totalExpense.toFixed(2)}`} />
                <KpiCard title="Saldo" value={`R$ ${balance.toFixed(2)}`} />
            </div>

            {/* Cards extras */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AlmostBurstingCard data={almost} />
                <GoalsProgressCard goals={goals} />
                {/* espaço para outro card futuro */}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ExpensesPieChart data={expenseSummary} />
                <IncomeExpenseBarChart data={monthlyData} />
            </div>
        </div>
    );
}
