export default function Sidebar() {
    return (
        <aside className="w-64 bg-white shadow-md p-6 space-y-4 border-r h-screen flex flex-col">
            <h2 className="text-xl font-bold text-green-600">Controlaí</h2>

            <nav className="space-y-2 flex-1">
                <a className="block text-gray-700 hover:text-green-600" href="/dashboard">📊 Dashboard</a>
                <a className="block text-gray-700 hover:text-green-600" href="/dashboard/categories">📁 Categorias</a>
                <a className="block text-gray-700 hover:text-green-600" href="/dashboard/transactions">💸 Transações</a>
                <a className="block text-gray-700 hover:text-green-600" href="/dashboard/budgets">💰 Orçamento</a>
                <a className="block text-gray-700 hover:text-green-600" href="/dashboard/reports">📄 Relatórios</a>

            </nav>

            <button
                onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/auth/login";
                }}
                className="mt-8 text-red-500 hover:underline"
            >
                Sair
            </button>

        </aside>
    );
}
