import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function syncUser(email: string, authId: string) {
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

    return user;
}
