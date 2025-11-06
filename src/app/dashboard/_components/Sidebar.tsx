"use client";

import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {

    // Fechar via ESC no mobile
    useEffect(() => {
        function esc(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", esc);
        return () => document.removeEventListener("keydown", esc);
    }, [onClose]);

    return (
        <>
            {/* Overlay MOBILE apenas*/}
            <div
                onClick={onClose}
                className={cn(
                    "fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity z-40 md:hidden",
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            />

            {/* Sidebar base para desktop */}
            <aside
                className={cn(
                    "top-0 left-0 h-full w-64 bg-white border-r border-gray-200 shadow-md z-50 transition-transform duration-300 ease-out",
                    // mobile slide
                    open ? "translate-x-0 fixed md:static" : "-translate-x-full fixed md:translate-x-0 md:static",
                    // desktop sempre visível
                    "md:block"
                )}
            >
                <nav className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-green-600 mb-6">Controlaí</h2>

                    <SidebarLink href="/dashboard" onClick={onClose}>📊 Dashboard</SidebarLink>
                    <SidebarLink href="/dashboard/categories" onClick={onClose}>📁 Categorias</SidebarLink>
                    <SidebarLink href="/dashboard/fixed" onClick={onClose}>🧾 Contas Fixas</SidebarLink>
                    <SidebarLink href="/dashboard/transactions" onClick={onClose}>💸 Transações</SidebarLink>
                    <SidebarLink href="/dashboard/budgets" onClick={onClose}>📉 Orçamentos</SidebarLink>
                    <SidebarLink href="/dashboard/goals" onClick={onClose}>🐖 Metas</SidebarLink>
                    <SidebarLink href="/dashboard/reports" onClick={onClose}>📄 Relatórios</SidebarLink>

                    <button
                        onClick={async () => {
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/auth/login";
                        }}
                        className="block text-red-500 hover:underline mt-6"
                    >
                        Sair
                    </button>
                </nav>
            </aside>
        </>
    );
}

function SidebarLink({ href, children, onClick }: any) {
    return (
        <a
            href={href}
            onClick={onClick}
            className="block text-gray-700 hover:text-green-600 transition"
        >
            {children}
        </a>
    );
}
