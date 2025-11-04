export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-100 text-gray-900">
            <aside className="w-64 bg-white border-r p-6 shadow-sm">
                <h2 className="text-xl font-bold text-green-600 mb-4">Controlaí</h2>
                <nav className="space-y-2">
                    <a className="block hover:text-green-600" href="/dashboard">📊 Dashboard</a>
                    <a className="block hover:text-green-600" href="/dashboard/categories">📁 Categorias</a>
                    <a className="block text-gray-700 hover:text-green-600" href="/dashboard/transactions"> 💸 Transações</a>
                    <a className="block hover:text-green-600" href="/dashboard/reports">📄 Relatórios</a>
                </nav>
            </aside>

            <main className="flex-1 p-10">
                {children}
            </main>
        </div>

    );
}
