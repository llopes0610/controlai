export default function KpiCard({
    title,
    value,
}: {
    title: string;
    value: string;
}) {
    return (
        <div className="bg-white shadow rounded p-4">
            <p className="text-sm text-gray-500">{title}</p>
            <h2 className="text-2xl font-bold">{value}</h2>
        </div>
    );
}
