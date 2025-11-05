import { createServerSupabase } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// ===============
// LOGIN via POST
// ===============
export async function POST(req: Request) {
    const { email, password } = await req.json();

    const supabase = await createServerSupabase();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ success: true });
}

// ===============
// CALLBACK via GET (OAuth)
// ===============
export async function GET(req: NextRequest) {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get("code");

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return req.cookies.get(name)?.value;
                    },
                },
            }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user) {
            await fetch(`${process.env.NEXT_PUBLIC_URL}/api/sync-user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    authId: user.id,
                }),
            });
        }
    }

    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
