"use client";

import Sidebar from "./components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-100 text-gray-900">
            <Sidebar />

            <main className="flex-1 p-10">
                {children}
            </main>
        </div>
    );
}
