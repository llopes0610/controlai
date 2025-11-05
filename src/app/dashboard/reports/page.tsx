"use client";

import { useEffect, useMemo, useState } from "react";

/** ====== Tipos simples para consumo das APIs atuais ====== */
type TxType = "INCOME" | "EXPENSE";

interface Transaction {
    id: string;
    type: TxType;
    amount: number;
    date: string; // ISO
    category?: { name?: string };
}

interface Budget {
    id: string;
    category: { id: string; name: string };
    limit: number;
    month: number;
    year: number;
    percent?: number; // pode vir do seu endpoint
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
    isPaid: boolean;
}

type PeriodKey = "7d" | "30d" | "month" | "prev-month" | "last-3m" | "custom";

/** Util: formata moeda BR */
const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Util: cria range por período escolhido */
function computeRange(period: PeriodKey, from?: string, to?: string) {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
        case "7d":
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            end = now;
            break;
        case "30d":
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            end = now;
            break;
        case "month":
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case "prev-month": {
            const m = now.getMonth() - 1;
            const y = m < 0 ? now.getFullYear() - 1 : now.getFullYear();
            const mm = (m + 12) % 12;
            start = new Date(y, mm, 1);
            end = new Date(y, mm + 1, 0);
            break;
        }
        case "last-3m": {
            const m = now.getMonth() - 2;
            const y = m < 0 ? now.getFullYear() - 1 : now.getFullYear();
            const mm = (m + 12) % 12;
            start = new Date(y, mm, 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        }
        case "custom":
            start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
            end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

/** Util: fetch seguro */
async function getJSON<T = any>(url: string): Promise<T> {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}

/** ====== COMPONENTE ====== */
export default function ReportsPage() {
    /** Filtros */
    const [period, setPeriod] = useState<PeriodKey>("month");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    /** Dados base */
    const [tx, setTx] = useState<Transaction[]>([]);
    const [prevTx, setPrevTx] = useState<Transaction[]>([]); // para comparativo “mês anterior”
    const [goals, setGoals] = useState<Goal[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [fixed, setFixed] = useState<FixedBill[]>([]);

    /** Carrega tudo conforme período */
    useEffect(() => {
        const load = async () => {
            const { start, end } = computeRange(period, from, to);

            // 1) Transações do período selecionado
            const params = new URLSearchParams();
            params.set("from", start.toISOString().slice(0, 10));
            params.set("to", end.toISOString().slice(0, 10));
            const txRes = await getJSON<any>("/api/transactions?" + params.toString());
            const txList: Transaction[] = txRes.data ?? txRes;
            setTx(txList);

            // 2) Transações do mês anterior (comparativo)
            const prevRange = computeRange("prev-month");
            const prevParams = new URLSearchParams();
            prevParams.set("from", prevRange.start.toISOString().slice(0, 10));
            prevParams.set("to", prevRange.end.toISOString().slice(0, 10));
            const prevRes = await getJSON<any>("/api/transactions?" + prevParams.toString());
            setPrevTx(prevRes.data ?? prevRes);

            // 3) Budgets do mês base (se período for custom/last-3m, usamos o mês atual)
            const baseDate = period === "prev-month" ? prevRange.start : new Date();
            const bRes = await getJSON<Budget[]>(
                `/api/budgets?month=${baseDate.getMonth() + 1}&year=${baseDate.getFullYear()}`
            );
            setBudgets(bRes || []);

            // 4) Metas
            const gRes = await getJSON<Goal[]>("/api/goals");
            setGoals(gRes || []);

            // 5) Contas fixas (por mês — schema não tem year)
            const fMonth =
                period === "prev-month" ? prevRange.start.getMonth() + 1 : new Date().getMonth() + 1;
            const fRes = await getJSON<FixedBill[]>(`/api/fixed?month=${fMonth}`);
            setFixed(fRes || []);
        };

        void load();
    }, [period, from, to]);

    /** ====== Agregações ====== */
    const totals = useMemo(() => {
        const sum = (arr: Transaction[], type: TxType) =>
            arr.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

        const income = sum(tx, "INCOME");
        const expense = sum(tx, "EXPENSE");

        // impacto de fixas no mês (somatório simples das fixas do mês base)
        const fixedSum = fixed.reduce((s, f) => s + (Number(f.amount) || 0), 0);

        return {
            income,
            expense,
            balance: income - expense,
            fixedSum,
        };
    }, [tx, fixed]);

    /** Comparativo com mês anterior */
    const compare = useMemo(() => {
        const sum = (arr: Transaction[], type: TxType) =>
            arr.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

        const currIncome = totals.income;
        const currExpense = totals.expense;
        const prevIncome = sum(prevTx, "INCOME");
        const prevExpense = sum(prevTx, "EXPENSE");

        const delta = (curr: number, prev: number) =>
            prev === 0 ? (curr === 0 ? 0 : 100) : ((curr - prev) / prev) * 100;

        return {
            incomePct: delta(currIncome, prevIncome),
            expensePct: delta(currExpense, prevExpense),
        };
    }, [totals, prevTx]);

    /** Ranking de categorias do período (despesa) */
    const topCategories = useMemo(() => {
        const map = new Map<string, number>();
        tx.filter((t) => t.type === "EXPENSE").forEach((t) => {
            const name = t.category?.name ?? "Sem categoria";
            map.set(name, (map.get(name) || 0) + t.amount);
        });

        return Array.from(map, ([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);
    }, [tx]);

    /** Tendências dos últimos 6 meses (texto) */
    const trends = useMemo(() => {
        // Para simplificar: com os dados do período atual, inferimos tendência básica
        // (opcional: você pode futuramente buscar 6 meses via /api/transactions com range amplo)
        const byMonth: Record<string, { inc: number; exp: number }> = {};
        tx.forEach((t) => {
            const key = new Date(t.date).toLocaleString("pt-BR", { month: "short", year: "2-digit" });
            if (!byMonth[key]) byMonth[key] = { inc: 0, exp: 0 };
            if (t.type === "INCOME") byMonth[key].inc += t.amount;
            else byMonth[key].exp += t.amount;
        });

        const points = Object.entries(byMonth).map(([k, v]) => ({
            k,
            inc: v.inc,
            exp: v.exp,
            sav: v.inc - v.exp,
        }));

        const dir = (seq: number[]) => {
            if (seq.length < 2) return "estável";
            const last = seq[seq.length - 1];
            const prev = seq[seq.length - 2];
            if (last > prev) return "subindo";
            if (last < prev) return "caindo";
            return "estável";
        };

        return {
            income: dir(points.map((p) => p.inc)),
            expense: dir(points.map((p) => p.exp)),
            savings: dir(points.map((p) => p.sav)),
        };
    }, [tx]);

    /** Anomalias (gasto 200% acima da média nas categorias) — usando média do próprio período */
    const anomalies = useMemo(() => {
        // média simples por categoria vs valor atual
        const map: Record<string, number[]> = {};
        tx.filter((t) => t.type === "EXPENSE").forEach((t) => {
            const name = t.category?.name ?? "Sem categoria";
            if (!map[name]) map[name] = [];
            map[name].push(t.amount);
        });

        const res: { name: string; total: number; avg: number }[] = [];
        Object.entries(map).forEach(([name, arr]) => {
            const total = arr.reduce((s, v) => s + v, 0);
            const avg = arr.length ? total / arr.length : 0;
            if (avg > 0 && total >= 2 * avg) {
                res.push({ name, total, avg });
            }
        });
        return res.sort((a, b) => b.total - a.total).slice(0, 3);
    }, [tx]);

    /** Temperatura financeira */
    const score = useMemo(() => {
        // base: % do orçamento (se disponível) + fixed share + saldo
        const totalBudget = budgets.reduce((s, b) => s + (Number(b.limit) || 0), 0);
        const totalExpense = totals.expense;
        const usedPct = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

        const fixedShare = totals.income > 0 ? (totals.fixedSum / totals.income) * 100 : 0;
        const positive = totals.balance >= 0;

        // Heurística simples de score
        let status: "OK" | "WARN" | "RISK" = "OK";
        if (usedPct >= 100 || fixedShare >= 50 || !positive) status = "RISK";
        else if (usedPct >= 80 || fixedShare >= 35) status = "WARN";

        return {
            usedPct,
            fixedShare,
            status,
            color: status === "OK" ? "bg-green-100 text-green-800" : status === "WARN" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800",
        };
    }, [budgets, totals]);

    /** Resumo “Este mês em resumo” */
    const summaryText = useMemo(() => {
        const fixedPct = totals.income > 0 ? (totals.fixedSum / totals.income) * 100 : 0;
        const investPct =
            totals.income > 0
                ? (goals.reduce((s, g) => s + (Number(g.current) || 0), 0) / totals.income) * 100
                : 0;

        const saldoTxt = totals.balance >= 0 ? "saldo positivo" : "saldo negativo";
        return `Você gastou ${fixedPct.toFixed(0)}% da renda em contas fixas, investiu ${investPct.toFixed(
            0
        )}% em metas e teve ${saldoTxt}.`;
    }, [totals, goals]);

    /** Simulador simples (sugestões) */
    const suggestions = useMemo(() => {
        const top = topCategories[0];
        const list: string[] = [];
        if (top) {
            const cut10 = top.total * 0.1;
            list.push(
                `Se reduzir **${top.name}** em 10% (${fmt(cut10)}), você melhora o saldo e pode antecipar metas.`
            );
        }
        if (totals.fixedSum > 0) {
            list.push(
                `Renegociar contas fixas em 5% renderia ${fmt(totals.fixedSum * 0.05)} por mês.`
            );
        }
        if (goals.length > 0) {
            const g = goals[0];
            const falta = Math.max(0, g.target - g.current);
            if (falta > 0) {
                list.push(
                    `Direcionando ${fmt(falta / 4)} por 4 meses, você conclui **${g.name}** rapidamente.`
                );
            }
        }
        return list.slice(0, 3);
    }, [topCategories, totals.fixedSum, goals]);

    /** KPIs do período */
    const kpis = [
        { label: "Receita", value: fmt(totals.income), hint: `vs mês anterior: ${compare.incomePct.toFixed(0)}%` },
        { label: "Despesa", value: fmt(totals.expense), hint: `vs mês anterior: ${compare.expensePct.toFixed(0)}%` },
        { label: "Saldo", value: fmt(totals.balance), hint: `Fixas: ${fmt(totals.fixedSum)}` },
    ];

    /** UI helpers */
    const Btn = ({
        active,
        onClick,
        children,
    }: {
        active?: boolean;
        onClick: () => void;
        children: React.ReactNode;
    }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded border transition text-sm ${active ? "bg-green-600 text-white" : "bg-white hover:bg-gray-50"
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Relatórios</h1>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
                <Btn active={period === "7d"} onClick={() => setPeriod("7d")}>Últimos 7 dias</Btn>
                <Btn active={period === "30d"} onClick={() => setPeriod("30d")}>Últimos 30 dias</Btn>
                <Btn active={period === "month"} onClick={() => setPeriod("month")}>Este mês</Btn>
                <Btn active={period === "prev-month"} onClick={() => setPeriod("prev-month")}>Mês anterior</Btn>
                <Btn active={period === "last-3m"} onClick={() => setPeriod("last-3m")}>Últimos 3 meses</Btn>

                <div className="ml-2 flex gap-2 items-center">
                    <input
                        type="date"
                        className="border rounded p-1 text-sm"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />
                    <span className="text-sm">→</span>
                    <input
                        type="date"
                        className="border rounded p-1 text-sm"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                    <Btn
                        active={period === "custom"}
                        onClick={() => setPeriod("custom")}
                    >
                        Aplicar
                    </Btn>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {kpis.map((k) => (
                    <div key={k.label} className="rounded-2xl bg-white border shadow-sm p-4">
                        <div className="text-sm text-gray-600">{k.label}</div>
                        <div className="text-2xl font-semibold">{k.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{k.hint}</div>
                    </div>
                ))}
            </div>

            {/* Temperatura + Resumo + Comparativo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white border p-4 shadow-sm">
                    <div className="text-sm font-medium mb-2">Temperatura financeira</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs ${score.color}`}>
                        {score.status === "OK" ? "🟢 Saudável" : score.status === "WARN" ? "🟡 Atenção" : "🔴 Risco"}
                    </div>
                    <div className="text-xs text-gray-600 mt-3">
                        Uso do orçamento: <b>{score.usedPct.toFixed(0)}%</b><br />
                        Contas fixas / renda: <b>{score.fixedShare.toFixed(0)}%</b>
                    </div>
                </div>

                <div className="rounded-2xl bg-white border p-4 shadow-sm">
                    <div className="text-sm font-medium mb-2">Este mês em resumo</div>
                    <div className="text-sm text-gray-700">{summaryText}</div>
                </div>

                <div className="rounded-2xl bg-white border p-4 shadow-sm">
                    <div className="text-sm font-medium mb-2">Tendências</div>
                    <ul className="text-sm text-gray-700 space-y-1">
                        <li>Receita: <b>{trends.income}</b></li>
                        <li>Despesas: <b>{trends.expense}</b></li>
                        <li>Poupança: <b>{trends.savings}</b></li>
                    </ul>
                </div>
            </div>

            {/* Ranking + Anomalias + Sugestões */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white border p-4 shadow-sm">
                    <div className="text-sm font-medium mb-2">Top categorias do período</div>
                    <ol className="text-sm space-y-2">
                        {topCategories.map((c, i) => (
                            <li key={c.name} className="flex justify-between">
                                <span>
                                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {c.name}
                                </span>
                                <span className="font-medium">{fmt(c.total)}</span>
                            </li>
                        ))}
                        {topCategories.length === 0 && (
                            <li className="text-gray-500">Sem despesas no período.</li>
                        )}
                    </ol>
                </div>

                <div className="rounded-2xl bg-white border p-4 shadow-sm">
                    <div className="text-sm font-medium mb-2">Anomalias detectadas</div>
                    <ul className="text-sm space-y-2">
                        {anomalies.length === 0 && (
                            <li className="text-gray-500">Nenhuma anomalia relevante.</li>
                        )}
                        {anomalies.map((a) => (
                            <li key={a.name} className="flex justify-between">
                                <span>⚠️ {a.name}</span>
                                <span className="text-gray-700">{fmt(a.total)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="rounded-2xl bg-white border p-4 shadow-sm">
                    <div className="text-sm font-medium mb-2">Simulador de decisão</div>
                    <ul className="text-sm space-y-2">
                        {suggestions.map((s, idx) => (
                            <li key={idx} className="text-gray-700">
                                • <span dangerouslySetInnerHTML={{ __html: s.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") }} />
                            </li>
                        ))}
                        {suggestions.length === 0 && (
                            <li className="text-gray-500">Sem sugestões para este período.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
