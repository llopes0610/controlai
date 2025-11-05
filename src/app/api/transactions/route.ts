export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase-server";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// ==========================
// GET  → listagem com filtros + paginação + período
// ==========================
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const period = searchParams.get("period");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const skip = (page - 1) * limit;

    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ data: [], total: 0 });

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });

    if (!dbUser) return NextResponse.json({ data: [], total: 0 });

    const where: {
        userId: string;
        description?: { contains: string; mode: "insensitive" };
        type?: string;
        date?: { gte?: Date; lte?: Date };
    } = { userId: dbUser.id };

    if (search) {
        where.description = { contains: search, mode: "insensitive" };
    }

    if (type) {
        where.type = type.toUpperCase();
    }

    if (period === "7d") {
        where.date = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    if (period === "30d") {
        where.date = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    if (period === "month") {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        where.date = { gte: start };
    }

    if (from && to) {
        where.date = {
            gte: new Date(from),
            lte: new Date(to),
        };
    }

    const total = await prisma.transaction.count({ where });

    const rows = await prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: { category: true },
    });

    const transactions = rows.map((t) => ({
        ...t,
        amount: Number(t.amount),
    }));

    return NextResponse.json({
        data: transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
}

// ==========================
// POST → criar transação
// ==========================
export async function POST(req: Request) {
    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });
    if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { description, amount, type, categoryId, date } = await req.json();

    const normalized = String(amount).replace(",", ".");
    const decimalAmount = new Prisma.Decimal(normalized);

    const newTx = await prisma.transaction.create({
        data: {
            description: description ?? null,
            amount: decimalAmount,
            type,
            categoryId,
            date: date ? new Date(date) : new Date(),
            userId: dbUser.id,
        },
        include: { category: true },
    });

    return NextResponse.json({
        ...newTx,
        amount: Number(newTx.amount),
    });
}

// ==========================
// PUT → atualizar transação (descrição/valor simples)
// ==========================
export async function PUT(req: Request) {
    const { id, description, amount } = await req.json();

    const tx = await prisma.transaction.update({
        where: { id },
        data: {
            description,
            amount: new Prisma.Decimal(String(amount).replace(",", ".")),
        },
    });

    return NextResponse.json(tx);
}

// ==========================
// DELETE → remover transação
// ==========================
export async function DELETE(req: Request) {
    const { id } = await req.json();

    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
