"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-100 text-gray-900">

            {/* Sidebar Desktop */}
            <aside className="hidden md:block w-64 bg-white border-r p-6 shadow-sm">
                <Sidebar />
            </aside>

            {/* Sidebar Mobile Drawer */}
            {open && (
                <aside className="fixed inset-0 bg-black/40 z-40">
                    <div className="absolute left-0 top-0 w-64 h-full bg-white p-6 shadow-lg">
                        <Sidebar onClose={() => setOpen(false)} />
                    </div>
                </aside>
            )}

            {/* Botão Mobile */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 bg-green-600 text-white p-2 rounded"
            >
                ☰
            </button>

            <main className="flex-1 p-4 md:p-10">
                {children}
            </main>
        </div>
    );
}
