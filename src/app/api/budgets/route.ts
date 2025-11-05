export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase-server";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// ======================
// GET (listar budgets)
// ======================
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([]);

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });
    if (!dbUser) return NextResponse.json([]);

    const where: any = { userId: dbUser.id };

    if (month && year) {
        where.month = month;
        where.year = year;
    }

    const budgets = await prisma.budget.findMany({
        where,
        include: { category: true },
    });

    // === gastos por categoria no mês ===
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const grouped = await prisma.transaction.groupBy({
        by: ["categoryId"],
        _sum: { amount: true },
        where: {
            userId: dbUser.id,
            type: "EXPENSE",
            date: { gte: start, lte: end },
        },
    });

    const spentMap: Record<string, number> = {};
    grouped.forEach(g => {
        spentMap[g.categoryId] = Number(g._sum.amount || 0);
    });

    return NextResponse.json(
        budgets.map((b) => ({
            ...b,
            limit: Number(b.limit),
            spent: spentMap[b.categoryId] || 0,
            percent: ((spentMap[b.categoryId] || 0) / Number(b.limit)) * 100,
        }))
    );
}


// ======================
// POST (criar ou atualizar)
// ======================
export async function POST(req: Request) {
    const { categoryId, limit, month, year } = await req.json();

    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const decimalLimit = new Prisma.Decimal(String(limit).replace(",", "."));

    const budget = await prisma.budget.upsert({
        where: {
            userId_categoryId_month_year: {
                userId: dbUser.id,
                categoryId,
                month,
                year,
            }
        },
        update: {
            limit: decimalLimit,
        },
        create: {
            userId: dbUser.id,
            categoryId,
            limit: decimalLimit,
            month,
            year,
        }
    });

    return NextResponse.json({
        ...budget,
        limit: Number(budget.limit),
    });
}


// ======================
// DELETE
// ======================
export async function DELETE(req: Request) {
    const { id } = await req.json();

    const budget = await prisma.budget.delete({
        where: { id },
    });

    return NextResponse.json({
        ...budget,
        limit: Number(budget.limit),
    });
}
