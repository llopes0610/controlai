import prisma from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase-server";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json([]);

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });
    if (!dbUser) return NextResponse.json([]);

    const rows = await prisma.transaction.findMany({
        where: { userId: dbUser.id },
        orderBy: { date: "desc" },
        include: { category: true },
    });

    // 🔁 Converte Prisma.Decimal -> number para JSON
    const transactions = rows.map((t) => ({
        ...t,
        amount: (t.amount as unknown as Prisma.Decimal).toNumber(),
    }));

    return NextResponse.json(transactions);
}

export async function POST(req: Request) {
    const body = await req.json();
    const { description, amount, type, categoryId, date } = body;

    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 🔢 normaliza amount (permite vírgula) e cria Decimal
    const normalized = String(amount).replace(",", ".");
    const decimalAmount = new Prisma.Decimal(normalized);

    const newTx = await prisma.transaction.create({
        data: {
            description: description ?? null,
            amount: decimalAmount,
            type, // "INCOME" | "EXPENSE"
            categoryId,
            date: date ? new Date(date) : new Date(),
            userId: dbUser.id,
        },
        include: { category: true },
    });

    return NextResponse.json({
        ...newTx,
        amount: (newTx.amount as unknown as Prisma.Decimal).toNumber(),
    });
}

export async function DELETE(req: Request) {
    const { id } = await req.json();

    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 🔐 Apaga somente se pertencer ao usuário
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.userId !== dbUser.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
