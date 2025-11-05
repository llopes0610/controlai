"use client";

interface Goal {
    id: string;
    name: string;
    current: number;
    target: number;
}

export default function GoalsProgressCard({ goals }: { goals: Goal[] }) {
    if (!goals.length) return null;

    return (
        <div className="bg-white p-4 rounded shadow space-y-2">
            <h2 className="font-bold text-gray-800 text-sm">🎯 Metas em andamento</h2>

            {goals.map((g) => {
                const percent = Math.min((g.current / g.target) * 100, 100);

                return (
                    <div key={g.id}>
                        <div className="flex justify-between text-xs mb-1">
                            <span>{g.name}</span>
                            <span>{percent.toFixed(0)}%</span>
                        </div>

                        <div className="w-full bg-gray-200 h-2 rounded">
                            <div
                                className="bg-blue-600 h-2 rounded"
                                style={{ width: `${percent}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
