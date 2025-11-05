export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase-server";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// GET -> listar contas fixas (com filtros month opcionais)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = Number(searchParams.get("month"));

        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json([]);

        const dbUser = await prisma.user.findUnique({
            where: { authId: user.id },
        });
        if (!dbUser) return NextResponse.json([]);

        const where: any = { userId: dbUser.id };

        if (month && month >= 1 && month <= 12) {
            where.month = month;
        }

        const fixed = await prisma.fixedBill.findMany({
            where,
            orderBy: { dueDay: "asc" },
        });

        return NextResponse.json(
            fixed.map(f => ({
                ...f,
                amount: Number(f.amount),
                isPaid: Boolean(f.isPaid)
            }))
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// POST
export async function POST(req: Request) {
    try {
        const { name, amount, dueDay, month, notes } = await req.json();

        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" });

        const dbUser = await prisma.user.findUnique({
            where: { authId: user.id },
        });

        const decimalAmount = new Prisma.Decimal(String(amount).replace(",", "."));

        const bill = await prisma.fixedBill.create({
            data: {
                userId: dbUser!.id,
                name,
                amount: decimalAmount,
                dueDay: Number(dueDay) || 1,
                month: Number(month) + 1, // <= CORREÇÃO
                notes: notes ?? null,
            },
        });

        return NextResponse.json({
            ...bill,
            amount: Number(bill.amount),
            isPaid: Boolean(bill.isPaid)
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const { id, isPaid } = await req.json();
    const bill = await prisma.fixedBill.update({
        where: { id },
        data: { isPaid: Boolean(isPaid) },
    });

    return NextResponse.json({
        ...bill,
        amount: Number(bill.amount),
        isPaid: Boolean(bill.isPaid)
    });
}

export async function DELETE(req: Request) {
    const { id } = await req.json();
    const bill = await prisma.fixedBill.delete({
        where: { id },
    });

    return NextResponse.json({
        ...bill,
        amount: Number(bill.amount),
        isPaid: Boolean(bill.isPaid)
    });
}
