"use client";

import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface MonthlyData {
    month: string;
    income: number;
    expense: number;
}

export default function IncomeExpenseBarChart({ data }: { data: MonthlyData[] }) {
    const chartData = {
        labels: data.map((d) => d.month),
        datasets: [
            {
                label: "Receitas",
                data: data.map((d) => d.income),
                backgroundColor: "#4bc0c0",
            },
            {
                label: "Despesas",
                data: data.map((d) => d.expense),
                backgroundColor: "#ff6384",
            },
        ],
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow w-full">
            <h2 className="font-bold text-lg mb-2">Receitas x Despesas (Mensal)</h2>
            <Bar data={chartData} />
        </div>
    );
}
