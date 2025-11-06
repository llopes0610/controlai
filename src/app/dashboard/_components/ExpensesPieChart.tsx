"use client";

import {
    ArcElement,
    ChartData,
    Chart as ChartJS,
    ChartOptions,
    Legend,
    Tooltip,
} from "chart.js";
import { Pie } from "react-chartjs-2";

// opcional (mostra % dentro da fatia)
let DataLabels: any = null;
try {
    // evita quebrar se o pacote não estiver instalado
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    DataLabels = require("chartjs-plugin-datalabels");
} catch { }

ChartJS.register(ArcElement, Tooltip, Legend, ...(DataLabels ? [DataLabels] : []));

interface ExpenseData {
    label: string;
    value: number;
}

export default function ExpensesPieChart({ data }: { data: ExpenseData[] }) {
    const total = data.reduce((s, d) => s + d.value, 0);

    const chartData: ChartData<"pie"> = {
        labels: data.map((d) => d.label),
        datasets: [
            {
                label: "Despesas por categoria",
                data: data.map((d) => d.value),
                backgroundColor: [
                    "#ef476f", // pink/danger
                    "#36a2eb", // blue
                    "#ffcc56", // yellow
                    "#4bc0c0", // teal
                    "#9966ff", // purple
                    "#ff9f40", // orange
                ],
                borderColor: "#ffffff",
                borderWidth: 2,
                hoverOffset: 6,
            },
        ],
    };

    const options: ChartOptions<"pie"> = {
        responsive: true,
        maintainAspectRatio: false, // permite controlar altura via CSS
        layout: { padding: 8 },
        animation: {
            animateRotate: true,
            duration: 700,
            easing: "easeOutQuart",
        },
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true,
                    pointStyle: "circle",
                    boxWidth: 10,
                    boxHeight: 10,
                    padding: 16,
                    color: "#111827", // text-gray-900
                    font: { size: 12, weight: "600" },
                },
            },
            tooltip: {
                backgroundColor: "#ffffff",
                titleColor: "#111827",
                bodyColor: "#374151",
                borderColor: "rgba(0,0,0,0.06)",
                borderWidth: 1,
                titleFont: { weight: "700" },
                bodyFont: { weight: "500" },
                padding: 10,
                callbacks: {
                    label(ctx) {
                        const raw = ctx.raw as number;
                        const pct = total ? ((raw / total) * 100).toFixed(1) : "0.0";
                        const value = raw.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        });
                        return ` ${value} • ${pct}%`;
                    },
                },
            },
            // donut moderno
            // @ts-ignore: propriedade de pie/doughnut
            cutout: "58%",
            // rótulos dentro das fatias (se plugin instalado)
            ...(DataLabels
                ? {
                    datalabels: {
                        color: "#111827",
                        formatter: (value: number) => {
                            if (!total) return "";
                            const pct = (value / total) * 100;
                            // mostra apenas se a fatia >= 6%
                            return pct >= 6 ? `${pct.toFixed(0)}%` : "";
                        },
                        font: {
                            weight: "700",
                            size: 12,
                        },
                    },
                }
                : {}),
        },
    };

    // texto central (total), simples e leve
    const centerTextPlugin = {
        id: "centerText",
        beforeDraw(chart: any) {
            const { width, height, ctx } = chart;
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#6B7280"; // text-gray-500
            ctx.font = "600 12px Inter, ui-sans-serif";
            ctx.fillText("Total", width / 2, height / 2 - 8);
            ctx.fillStyle = "#111827"; // text-gray-900
            ctx.font = "700 16px Inter, ui-sans-serif";
            ctx.fillText(
                total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                width / 2,
                height / 2 + 10
            );
            ctx.restore();
        },
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition animate-fade-in">
            <h2 className="font-semibold text-gray-900 mb-4">Despesas por categoria</h2>

            {/* wrapper para controlar tamanho com maintainAspectRatio=false */}
            <div className="h-[360px] flex items-center justify-center">
                <Pie data={chartData} options={options} plugins={[centerTextPlugin]} />
            </div>
        </div>
    );
}
