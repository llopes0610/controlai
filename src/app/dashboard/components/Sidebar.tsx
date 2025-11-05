"use client";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
    return (
        <nav className="space-y-4">
            <h2 className="text-xl font-bold text-green-600 mb-4">Controlaí</h2>

            <a href="/dashboard" onClick={onClose} className="block hover:text-green-600">📊 Dashboard</a>
            <a href="/dashboard/categories" onClick={onClose} className="block hover:text-green-600">📁 Categorias</a>
            <a href="/dashboard/fixed" onClick={onClose} className="block hover:text-green-600">🧾 Contas Fixas</a>
            <a href="/dashboard/transactions" onClick={onClose} className="block hover:text-green-600">💸 Transações</a>
            <a href="/dashboard/budgets" onClick={onClose} className="block hover:text-green-600">📉 Orçamentos</a>
            <a href="/dashboard/goals" onClick={onClose} className="block hover:text-green-600">🐖 Metas</a>
            <a href="/dashboard/reports" onClick={onClose} className="block hover:text-green-600">📄 Relatórios</a>

            <button
                onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/auth/login";
                }}
                className="mt-6 text-red-500 hover:underline"
            >
                Sair
            </button>
        </nav>
    );
}
