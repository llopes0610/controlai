export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase-server";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// GET
export async function GET(req: Request) {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([]);

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id }
    });
    if (!dbUser) return NextResponse.json([]);

    const goals = await prisma.savingGoal.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(
        goals.map(g => ({
            ...g,
            target: Number(g.target),
            current: Number(g.current)
        }))
    );
}

// POST
export async function POST(req: Request) {
    const { name, description, target, deadline } = await req.json();

    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id }
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const decimal = new Prisma.Decimal(String(target).replace(",", "."));

    const goal = await prisma.savingGoal.create({
        data: {
            userId: dbUser.id,
            name,
            description,
            target: decimal,
            deadline: deadline ? new Date(deadline) : null
        }
    });

    return NextResponse.json({
        ...goal,
        target: Number(goal.target),
        current: Number(goal.current)
    });
}

// PUT (depositar)
export async function PUT(req: Request) {
    const { id, amount } = await req.json();

    const goal = await prisma.savingGoal.update({
        where: { id },
        data: {
            current: {
                increment: new Prisma.Decimal(String(amount).replace(",", "."))
            }
        }
    });

    return NextResponse.json({
        ...goal,
        target: Number(goal.target),
        current: Number(goal.current)
    });
}

// DELETE
export async function DELETE(req: Request) {
    const { id } = await req.json();

    const goal = await prisma.savingGoal.delete({
        where: { id }
    });

    return NextResponse.json({
        ...goal,
        target: Number(goal.target),
        current: Number(goal.current)
    });
}
