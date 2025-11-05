"use client";

import { useEffect, useMemo, useState } from "react";

/** ==== Tipos alinhados às suas APIs ==== */
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
    category: { id?: string; name: string };
    categoryId: string;
    limit: number;
    month: number;
    year: number;
    /** opcionalmente pode vir do backend; calculamos no client também */
    percent?: number;
    used?: number;
}

interface Goal {
    id: string;
    name: string;
    description?: string;
    target: number;
    current: number;
    deadline?: string | null;
    createdAt?: string;
}

interface FixedBill {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    month: number;
    isPaid: boolean;
    notes?: string;
}

/** ==== Utils ==== */
const BRL = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const monthLabel = (d: Date) =>
    d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");

function startOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Média de poupança mensal: saldo positivo médio (receita - despesa) */
function avgMonthlySaving(hist: { month: string; income: number; expense: number }[]) {
    if (!hist.length) return 0;
    const sums = hist.reduce((acc, m) => acc + (m.income - m.expense), 0);
    return Math.max(0, sums / hist.length);
}

/** Projeção de meses para concluir meta */
function goalMonthsToFinish(goal: Goal, avgSave: number) {
    const remain = Math.max(0, goal.target - goal.current);
    if (remain === 0) return 0;
    if (avgSave <= 0) return Infinity;
    return Math.ceil(remain / avgSave);
}

/** Bar simples */
function Bar({ percent, color = "bg-green-600" }: { percent: number; color?: string }) {
    const p = Math.max(0, Math.min(100, percent));
    return (
        <div className="w-full bg-gray-200 h-2 rounded">
            <div className={`${color} h-2 rounded`} style={{ width: `${p}%` }} />
        </div>
    );
}

/** Chip */
function Chip({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {children}
        </span>
    );
}

/** KPI card */
function Kpi({ title, value, hint }: { title: string; value: string; hint?: string }) {
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">{title}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
        </div>
    );
}

export default function ReportsPage() {
    const [txs, setTxs] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [fixed, setFixed] = useState<FixedBill[]>([]);
    const [loading, setLoading] = useState(true);

    // range: mês atual por padrão
    const now = new Date();
    const [from] = useState<string>(startOfMonth(now).toISOString().slice(0, 10));
    const [to] = useState<string>(endOfMonth(now).toISOString().slice(0, 10));

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);

                // Transações: usamos lista crua e montamos históricos
                const txRes = await fetch("/api/transactions");
                const txJson = await txRes.json();
                setTxs((txJson.data ?? txJson) as Transaction[]);

                // Budgets do mês atual
                const bRes = await fetch(
                    `/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
                );
                const bJson = await bRes.json();
                setBudgets(bJson as Budget[]);

                // Goals
                const gRes = await fetch("/api/goals");
                setGoals(await gRes.json());

                // Fixed (mês atual)
                const fRes = await fetch(`/api/fixed?month=${now.getMonth() + 1}`);
                const fJson = await fRes.json();
                setFixed(Array.isArray(fJson) ? fJson : []);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** ====== Dados derivados ====== */
    const filteredTxs = useMemo(() => {
        const start = new Date(from);
        const end = new Date(to);
        return txs.filter((t) => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });
    }, [txs, from, to]);

    // KPIs
    const { income, expense, balance } = useMemo(() => {
        const inc = filteredTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
        const exp = filteredTxs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
        return { income: inc, expense: exp, balance: inc - exp };
    }, [filteredTxs]);

    // Evolução mensal (últimos 6 meses)
    const monthly = useMemo(() => {
        const byKey: Record<string, { income: number; expense: number; date: Date }> = {};
        txs.forEach((t) => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            if (!byKey[key]) byKey[key] = { income: 0, expense: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) };
            if (t.type === "INCOME") byKey[key].income += t.amount;
            else byKey[key].expense += t.amount;
        });
        const rows = Object.values(byKey).sort((a, b) => a.date.getTime() - b.date.getTime());
        return rows.slice(-6).map((r) => ({
            month: monthLabel(r.date),
            income: r.income,
            expense: r.expense,
        }));
    }, [txs]);

    // Tendência M/M
    const trend = useMemo(() => {
        if (monthly.length < 2) return { income: 0, expense: 0 };
        const last = monthly[monthly.length - 1];
        const prev = monthly[monthly.length - 2];
        const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100);
        return { income: pct(last.income, prev.income), expense: pct(last.expense, prev.expense) };
    }, [monthly]);

    // Composição por categoria (mês atual)
    const categoryBreakdown = useMemo(() => {
        const map = new Map<string, number>();
        filteredTxs
            .filter((t) => t.type === "EXPENSE")
            .forEach((t) => {
                const name = t.category?.name ?? "Sem categoria";
                map.set(name, (map.get(name) || 0) + t.amount);
            });
        const total = Array.from(map.values()).reduce((s, v) => s + v, 0) || 1;
        return Array.from(map.entries())
            .map(([name, value]) => ({
                name,
                value,
                percent: (value / total) * 100,
            }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTxs]);

    // Budgets performance (cruzamos com gastos do mês)
    const budgetsPerf = useMemo(() => {
        const byCat: Record<string, number> = {};
        filteredTxs
            .filter((t) => t.type === "EXPENSE")
            .forEach((t) => {
                const name = t.category?.name ?? "Sem categoria";
                byCat[name] = (byCat[name] || 0) + t.amount;
            });

        return budgets.map((b) => {
            const used = byCat[b.category?.name ?? ""] || 0;
            const pct = b.limit > 0 ? (used / b.limit) * 100 : 0;
            return { ...b, used, percent: pct };
        });
    }, [budgets, filteredTxs]);

    // Impacto de contas fixas
    const fixedImpact = useMemo(() => {
        const totalFixed = fixed.reduce((s, f) => s + f.amount, 0);
        const ratio = income > 0 ? (totalFixed / income) * 100 : 0;
        const top = [...fixed].sort((a, b) => b.amount - a.amount).slice(0, 3);
        return { totalFixed, ratio, top };
    }, [fixed, income]);

    // Média de poupança e projeções de metas
    const avgSave = useMemo(() => avgMonthlySaving(monthly), [monthly]);
    const goalsProjection = useMemo(() => {
        return goals.map((g) => {
            const months = goalMonthsToFinish(g, avgSave);
            return { ...g, monthsToFinish: months };
        });
    }, [goals, avgSave]);

    // Alertas
    const alerts = useMemo(() => {
        const riskBudgets = budgetsPerf.filter((b) => b.percent >= 80).map((b) => ({
            type: "budget" as const,
            text: `Categoria "${b.category?.name}" em ${b.percent.toFixed(0)}% do orçamento.`,
        }));

        const volCats: string[] = (() => {
            // volatilidade simples: desvio entre último e penúltimo
            if (monthly.length < 2) return [];
            const lastMonth = filteredTxs
                .filter((t) => new Date(t.date).getMonth() === now.getMonth() && t.type === "EXPENSE");
            const prevMonth = txs.filter((t) => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() - 1 && t.type === "EXPENSE";
            });
            const sumBy = (arr: Transaction[]) => {
                const m = new Map<string, number>();
                arr.forEach((t) => {
                    const name = t.category?.name ?? "Sem categoria";
                    m.set(name, (m.get(name) || 0) + t.amount);
                });
                return m;
            };
            const lastM = sumBy(lastMonth);
            const prevM = sumBy(prevMonth);
            const out: string[] = [];
            lastM.forEach((v, k) => {
                const base = prevM.get(k) || 0;
                if (base > 0 && (v - base) / base >= 0.3) out.push(k);
            });
            return out;
        })();

        const volatility = volCats.map((c) => ({
            type: "volatility" as const,
            text: `Gasto em "${c}" cresceu forte versus o mês anterior.`,
        }));

        return [...riskBudgets, ...volatility];
    }, [budgetsPerf, filteredTxs, monthly, now, txs]);

    // Score (gamificado simples)
    const score = useMemo(() => {
        let s = 100;
        const riskCount = budgetsPerf.filter((b) => b.percent >= 90).length;
        s -= riskCount * 8;
        const fixedWeight = Math.min(40, Math.round(fixedImpact.ratio)); // penaliza até 40 pts
        s -= fixedWeight * 0.5;
        if (avgSave <= 0) s -= 15;
        return Math.max(0, Math.min(100, Math.round(s)));
    }, [budgetsPerf, fixedImpact, avgSave]);

    const recs = useMemo(() => {
        const out: string[] = [];
        if (budgetsPerf.some((b) => b.percent >= 100)) out.push("Revise as categorias estouradas.");
        else if (budgetsPerf.some((b) => b.percent >= 80)) out.push("Aproxime-se menos de 80% do orçamento em categorias de risco.");
        if (fixedImpact.ratio > 40) out.push("Contas fixas tomando mais de 40% da renda — renegocie serviços.");
        if (avgSave <= 0) out.push("Seu saldo médio mensal está negativo. Considere cortar 10% das variáveis.");
        if (goals.length && avgSave > 0) out.push("Aumente sua meta em R$ 50/mês para concluir mais rápido.");
        if (!out.length) out.push("Boa disciplina! Mantenha o ritmo e revise orçamentos a cada 30 dias.");
        return out.slice(0, 3);
    }, [budgetsPerf, fixedImpact, avgSave, goals.length]);

    if (loading) {
        return <div className="p-6 text-sm text-gray-500">Carregando relatórios…</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Relatórios</h1>
                <Chip>Mês atual: {monthLabel(new Date())}</Chip>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Kpi title="Receita" value={BRL(income)} hint={`Tendência M/M: ${trend.income.toFixed(1)}%`} />
                <Kpi title="Despesa" value={BRL(expense)} hint={`Tendência M/M: ${trend.expense.toFixed(1)}%`} />
                <Kpi title="Saldo" value={BRL(balance)} />
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Score financeiro</div>
                    <div className="text-2xl font-bold mt-1">{score}/100</div>
                    <div className="mt-2"><Bar percent={score} color={score >= 70 ? "bg-green-600" : score >= 40 ? "bg-yellow-500" : "bg-red-500"} /></div>
                </div>
            </div>

            {/* Evolução mensal */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Evolução mensal</h2>
                    <Chip>Últimos {monthly.length} meses</Chip>
                </div>
                {/* Barras simples lado a lado */}
                <div className="space-y-3">
                    {monthly.map((m, idx) => {
                        const max = Math.max(...monthly.map((x) => Math.max(x.income, x.expense)), 1);
                        const incP = (m.income / max) * 100;
                        const expP = (m.expense / max) * 100;
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="w-12 text-xs text-gray-600">{m.month}</div>
                                <div className="flex-1">
                                    <div className="text-[11px] text-gray-500 mb-1">Receita {BRL(m.income)}</div>
                                    <Bar percent={incP} color="bg-teal-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[11px] text-gray-500 mb-1">Despesa {BRL(m.expense)}</div>
                                    <Bar percent={expP} color="bg-rose-500" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Composição de despesas */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Composição de despesas (mês)</h2>
                    <Chip>{categoryBreakdown.length} categorias</Chip>
                </div>
                <div className="space-y-2">
                    {categoryBreakdown.map((c) => (
                        <div key={c.name}>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>{c.name}</span>
                                <span>
                                    {BRL(c.value)} • {c.percent.toFixed(0)}%
                                </span>
                            </div>
                            <Bar percent={c.percent} color="bg-indigo-500" />
                        </div>
                    ))}
                    {!categoryBreakdown.length && (
                        <div className="text-sm text-gray-500">Sem despesas neste mês.</div>
                    )}
                </div>
            </div>

            {/* Budgets performance */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Performance dos orçamentos</h2>
                    <Chip>Mês: {monthLabel(new Date())}</Chip>
                </div>
                <div className="space-y-3">
                    {budgetsPerf.map((b) => {
                        const color =
                            b.percent >= 100 ? "bg-red-500" : b.percent >= 80 ? "bg-yellow-500" : "bg-green-600";
                        return (
                            <div key={b.id} className="rounded-lg border p-3">
                                <div className="flex justify-between text-sm">
                                    <div className="font-medium">{b.category?.name}</div>
                                    <div className="text-gray-600">
                                        {BRL(b.used || 0)} / {BRL(b.limit)} • {Math.round(b.percent || 0)}%
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <Bar percent={b.percent || 0} color={color} />
                                </div>
                            </div>
                        );
                    })}
                    {!budgetsPerf.length && (
                        <div className="text-sm text-gray-500">Sem orçamentos cadastrados.</div>
                    )}
                </div>
            </div>

            {/* Metas com projeção */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Metas — projeção</h2>
                    <Chip>Média poupança: {BRL(avgSave)}</Chip>
                </div>
                <div className="space-y-3">
                    {goalsProjection.map((g) => {
                        const p = g.target > 0 ? (g.current / g.target) * 100 : 0;
                        const months = g.monthsToFinish;
                        const label =
                            months === Infinity
                                ? "Sem previsão (saldo médio ≤ 0)"
                                : months === 0
                                    ? "Concluída"
                                    : `${months} mês(es)`;
                        return (
                            <div key={g.id} className="rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">{g.name}</div>
                                    <div className="text-sm text-gray-600">
                                        {BRL(g.current)} / {BRL(g.target)} • {Math.round(p)}%
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <Bar percent={p} />
                                </div>
                                <div className="text-xs text-gray-600 mt-1">Previsão: {label}</div>
                            </div>
                        );
                    })}
                    {!goalsProjection.length && (
                        <div className="text-sm text-gray-500">Nenhuma meta cadastrada.</div>
                    )}
                </div>
            </div>

            {/* Contas fixas — impacto */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Contas fixas — impacto no mês</h2>
                    <Chip>{fixed.length} contas</Chip>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <Kpi title="Total de fixas" value={BRL(fixedImpact.totalFixed)} />
                    <Kpi title="% da renda" value={`${fixedImpact.ratio.toFixed(1)}%`} />
                    <Kpi title="Top despesa fixa" value={fixedImpact.top[0] ? fixedImpact.top[0].name : "—"} />
                </div>

                <div className="space-y-2">
                    {fixedImpact.top.map((f) => (
                        <div key={f.id}>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>{f.name}</span>
                                <span>{BRL(f.amount)}</span>
                            </div>
                            <Bar
                                percent={
                                    income > 0 ? Math.min(100, (f.amount / Math.max(income, 1)) * 100) : 0
                                }
                                color="bg-purple-500"
                            />
                        </div>
                    ))}
                    {!fixedImpact.top.length && (
                        <div className="text-sm text-gray-500">Sem contas fixas cadastradas.</div>
                    )}
                </div>
            </div>

            {/* Alertas + Recomendações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <h2 className="font-semibold mb-2">Alertas</h2>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {alerts.map((a, i) => (
                            <li key={i} className="text-gray-700">
                                {a.text}
                            </li>
                        ))}
                        {!alerts.length && <li className="text-gray-500">Sem alertas no momento.</li>}
                    </ul>
                </div>

                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                    <h2 className="font-semibold mb-2">Recomendações</h2>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {recs.map((r, i) => (
                            <li key={i} className="text-gray-700">
                                {r}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
