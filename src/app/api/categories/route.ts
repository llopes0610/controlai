import prisma from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json([]);
    }

    // ✅ busca USER no Postgres usando authId
    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });

    if (!dbUser) return NextResponse.json([]);

    const categories = await prisma.category.findMany({
        where: { userId: dbUser.id },
        orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
}

export async function POST(req: Request) {
    const { name, type } = await req.json();

    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ pega user real
    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const newCat = await prisma.category.create({
        data: {
            name,
            type,
            userId: dbUser.id,
        },
    });

    return NextResponse.json(newCat);
}

export async function DELETE(req: Request) {
    const { id } = await req.json();

    const supabase = await createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ pega user real
    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
    });

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // ✅ só apaga se a categoria pertencer ao dono
    await prisma.category.delete({
        where: {
            id_userId: {
                id,
                userId: dbUser.id,
            },
        },
    });

    return NextResponse.json({ success: true });
}
