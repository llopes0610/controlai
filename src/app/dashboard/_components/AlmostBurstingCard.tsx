"use client";

interface AlmostBudget {
    id: string;
    category: { name: string };
    limit: number;
    spent: number;
    percent: number;
}

export default function AlmostBurstingCard({ data }: { data: AlmostBudget[] }) {
    if (!data.length) return null;

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-bold text-lg mb-3">⚠ Categorias quase estourando</h2>

            <ul className="space-y-3 text-sm">
                {data.map((b) => (
                    <li key={b.id}>
                        <div className="flex justify-between">
                            <strong>{b.category.name}</strong>
                            <span>{b.percent.toFixed(0)}%</span>
                        </div>

                        <div className="text-xs text-gray-500">
                            R$ {b.spent.toFixed(2)} / R$ {b.limit.toFixed(2)}
                        </div>

                        <div className="w-full bg-gray-200 h-2 rounded mt-1">
                            <div
                                className={`${b.percent >= 100
                                    ? "bg-red-600"
                                    : b.percent >= 80
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    } h-2 rounded`}
                                style={{ width: `${Math.min(b.percent, 100)}%` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
