"use client";

import { useState } from "react";
import Sidebar from "./_components/Sidebar";

export default function DashboardLayout({ children }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* ✅ Sidebar (desktop e mobile controlado no componente) */}
            <Sidebar open={open} onClose={() => setOpen(false)} />

            {/* ✅ Botão Hamburguer MOBILE */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 bg-green-600 text-white p-2 rounded shadow"
            >
                ☰
            </button>

            {/* ✅ Conteúdo empurrado para o lado no desktop */}
            <main className="flex-1 p-4 md:p-8 ml-0 md:ml-64">
                {children}
            </main>
        </div>
    );
}
