"use client";

import { BadgeDelta } from "./badge-delta";
import { GlassCard } from "./glass-card";

export function KpiStat({
    title,
    value,
    delta,
    icon,
}: {
    title: string;
    value: string | number;
    delta?: number;
    icon?: React.ReactNode;
}) {
    return (
        <GlassCard className="p-4 md:p-6">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs text-gray-500">{title}</p>
                    <p className="text-2xl md:text-3xl font-semibold">{value}</p>
                    {typeof delta === "number" && <BadgeDelta value={delta} />}
                </div>
                {icon && (
                    <div className="rounded-lg bg-gray-900/5 p-2 text-gray-700">
                        {icon}
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
