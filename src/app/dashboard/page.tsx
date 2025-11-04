import { createServerSupabase } from "@/lib/supabase-server";

export default async function DashboardPage() {
    const supabase = await createServerSupabase();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <>
            <h1 className="text-3xl font-bold flex items-center gap-2">
                Bem-vindo ao Controlaí ✅
            </h1>

            <p className="mt-2 text-muted-foreground">
                Sua visão financeira começa aqui.
            </p>

            <p className="mt-4 text-sm text-muted-foreground">
                Usuário: {user?.email}
            </p>
        </>
    );
}
