"use client";

import {
    ArcElement,
    Chart as ChartJS,
    Legend,
    Tooltip,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseData {
    label: string;
    value: number;
}

export default function ExpensesPieChart({ data }: { data: ExpenseData[] }) {

    const chartData = {
        labels: data.map((d) => d.label),
        datasets: [
            {
                label: "Despesas por categoria",
                data: data.map((d) => d.value),
                backgroundColor: [
                    "#ff6384",
                    "#36a2eb",
                    "#ffcd56",
                    "#4bc0c0",
                    "#9966ff",
                    "#ff9f40",
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow w-[350px]">
            <h2 className="font-bold text-lg mb-2">Despesas por categoria</h2>
            <Pie data={chartData} />
        </div>
    );
}
