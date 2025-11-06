"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GlassCard({
    className,
    ...props
}: React.ComponentProps<typeof Card>) {
    return (
        <Card
            className={cn(
                "glass rounded-2xl card-pop fade-in border border-white/30 shadow-xl",
                className
            )}
            {...props}
        />
    );
}
