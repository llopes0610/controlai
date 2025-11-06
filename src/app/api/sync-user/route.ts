export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface SyncBody {
    email: string;
    authId: string;
}

export async function POST(req: Request) {
    const { email, authId }: SyncBody = await req.json();

    // busca user
    let user = await prisma.user.findUnique({
        where: { authId },
    });

    // cria user se não existir
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                authId,
            },
        });
    }

    const defaults = [
        { name: "Alimentação", type: "EXPENSE" },
        { name: "Transporte", type: "EXPENSE" },
        { name: "Moradia", type: "EXPENSE" },
        { name: "Saúde", type: "EXPENSE" },
        { name: "Lazer", type: "EXPENSE" },
        { name: "Educação", type: "EXPENSE" },
        { name: "Salário", type: "INCOME" },
        { name: "Outros", type: "EXPENSE" },
    ];

    // garante prefixo único baseado em (name, userId)
    for (const cat of defaults) {
        await prisma.category.upsert({
            where: {
                name_userId: {
                    name: cat.name,
                    userId: user.id,
                },
            },
            update: {},
            create: {
                name: cat.name,
                type: cat.type as any,
                userId: user.id,
            },
        });
    }

    return NextResponse.json({
        user,
        seeded: true,
    });
}
