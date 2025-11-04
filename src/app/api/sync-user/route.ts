import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const { email, authId } = await req.json();

    let user = await prisma.user.findUnique({
        where: { authId },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                authId,
            },
        });

        await prisma.category.createMany({
            data: [
                { name: "Alimentação", type: "EXPENSE", userId: user.id },
                { name: "Transporte", type: "EXPENSE", userId: user.id },
                { name: "Moradia", type: "EXPENSE", userId: user.id },
                { name: "Saúde", type: "EXPENSE", userId: user.id },
                { name: "Lazer", type: "EXPENSE", userId: user.id },
                { name: "Educação", type: "EXPENSE", userId: user.id },
                { name: "Salário", type: "INCOME", userId: user.id },
                { name: "Outros", type: "EXPENSE", userId: user.id },
            ],
        });
    }

    return NextResponse.json({ user });
}
