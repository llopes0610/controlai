"use client";

import { Badge } from "@/components/ui/badge";

export function BadgeDelta({ value }: { value: number }) {
    const up = value >= 0;
    return (
        <Badge
            variant="outline"
            className={
                up
                    ? "bg-emerald-50 text-emerald-700 border-emerald-500/40"
                    : "bg-rose-50 text-rose-700 border-rose-500/40"
            }
        >
            {up ? "▲ " : "▼ "}
            {value}%
        </Badge>
    );
}
