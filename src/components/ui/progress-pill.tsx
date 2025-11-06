"use client";

export function ProgressPill({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="font-medium">{value}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200/60 rounded-full overflow-hidden">
                <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
