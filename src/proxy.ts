import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
    const res = NextResponse.next();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    res.cookies.set(name, value, options);
                },
                remove(name: string, options: any) {
                    res.cookies.set(name, "", options);
                },
            },
        }
    );

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    const pathname = req.nextUrl.pathname;

    const publicRoutes = ["/auth/login", "/auth/register"];

    const isPublic = publicRoutes.some((r) => pathname.startsWith(r));
    const isDashboard = pathname.startsWith("/dashboard");

    if (!user && isDashboard) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    return res;
}

export const config = {
    matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
