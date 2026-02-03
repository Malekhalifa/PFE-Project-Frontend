"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getResults, getRawData } from "../../lib/api";

export default function ResultsPage() {
    const params = useParams();
    const jobId = params.jobId;

    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState("");
    const [rawData, setRawData] = useState<{ header: string[]; rows: string[][] } | null>(null);
    const [showRaw, setShowRaw] = useState(false);
    const [rawLoading, setRawLoading] = useState(false);
    const [rawError, setRawError] = useState("");

    if (!jobId || Array.isArray(jobId)) {
        return <p style={{ color: "red" }}>Invalid Job ID</p>;
    }

    useEffect(() => {
        getResults(jobId)
            .then(setResults)
            .catch(() => setError("Failed to fetch results"));
    }, [jobId]);

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!results) return <p>Loading results...</p>;

    const { cleaned_data, quality_report } = results;

    if (!quality_report) {
        return (
            <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
                <div className="mx-auto max-w-3xl space-y-4">
                    <h1 className="text-3xl font-semibold">
                        Results for Job {jobId}
                    </h1>
                    <p className="text-red-400">
                        Analysis completed but no quality report was generated.
                    </p>
                </div>
            </div>
        );
    }

    const {
        missing_rate,
        duplicate_rate,
        duplicate_count,
        outlier_rate,
        quality_score,
        type_consistency,
        numeric_stats,
    } = quality_report;

    const handleToggleRaw = async () => {
        if (showRaw) {
            setShowRaw(false);
            return;
        }
        if (rawData) {
            setShowRaw(true);
            return;
        }
        try {
            setRawError("");
            setRawLoading(true);
            const data = await getRawData(jobId as string);
            setRawData(data);
            setShowRaw(true);
        } catch {
            setRawError("Failed to load original data.");
        } finally {
            setRawLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
            <div className="mx-auto max-w-5xl space-y-8">
                <header>
                    <h1 className="text-3xl font-semibold">
                        Results for Job {jobId}
                    </h1>
                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={handleToggleRaw}
                            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold hover:bg-sky-500"
                        >
                            {showRaw ? "Show report" : "Show original data"}
                        </button>
                        {rawLoading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" />
                        )}
                        {rawError && (
                            <span className="text-sm text-red-400">{rawError}</span>
                        )}
                    </div>
                </header>

                {!showRaw && (
                    <>
                        <section className="rounded-xl bg-slate-900 p-6 shadow">
                            <h2 className="mb-3 text-xl font-semibold">
                                Cleaned Data Summary
                            </h2>
                            <p>Rows: {cleaned_data.rows}</p>
                            <p>Columns: {cleaned_data.columns}</p>
                        </section>

                        <section className="rounded-xl bg-slate-900 p-6 shadow">
                            <h2 className="mb-3 text-xl font-semibold">
                                Data Quality Report
                            </h2>
                            <ul className="space-y-1">
                                <li>Missing Rate: {missing_rate}</li>
                                <li>Duplicate Rate: {duplicate_rate}</li>
                                <li>Duplicate Row count: {duplicate_count}</li>
                                <li>Outlier Rate: {outlier_rate}</li>
                                <li>Quality Score: {quality_score}</li>
                            </ul>
                        </section>

                        {numeric_stats && (
                            <section className="rounded-xl bg-slate-900 p-6 shadow">
                                <h2 className="mb-3 text-xl font-semibold">
                                    Numeric Column Stats
                                </h2>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {Object.entries(numeric_stats).map(
                                        ([col, stats]: any) =>
                                            stats &&
                                            Object.keys(stats).length > 0 && (
                                                <div
                                                    key={col}
                                                    className="text-sm"
                                                >
                                                    <div className="font-mono font-semibold">
                                                        {col}
                                                    </div>
                                                    <div>Min: {stats.min}</div>
                                                    <div>Max: {stats.max}</div>
                                                    <div>Mean: {stats.mean}</div>
                                                </div>
                                            )
                                    )}
                                </div>
                            </section>
                        )}

                        {type_consistency && (
                            <section className="rounded-xl bg-slate-900 p-6 shadow">
                                <h2 className="mb-3 text-xl font-semibold">
                                    Type Consistency
                                </h2>
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="py-1">Column</th>
                                            <th className="py-1">Numeric</th>
                                            <th className="py-1">
                                                Non-numeric
                                            </th>
                                            <th className="py-1">Missing</th>
                                            <th className="py-1">Valid</th>
                                            <th className="py-1">Invalid</th>
                                            <th className="py-1">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(
                                            type_consistency
                                        ).map(([col, counts]: any) => (
                                            <tr
                                                key={col}
                                                className="border-b border-slate-800"
                                            >
                                                <td className="py-1 font-mono">
                                                    {col}
                                                </td>
                                                <td className="py-1">
                                                    {counts.numeric}
                                                </td>
                                                <td className="py-1">
                                                    {counts.non_numeric}
                                                </td>
                                                <td className="py-1">
                                                    {counts.missing}
                                                </td>
                                                <td className="py-1">
                                                    {counts.valid ?? "-"}
                                                </td>
                                                <td className="py-1">
                                                    {counts.invalid ?? "-"}
                                                </td>
                                                <td className="py-1">
                                                    {counts.total ?? "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                        )}


                    </>
                )}

                {showRaw && rawData && (
                    <section className="rounded-xl bg-slate-900 p-6 shadow">
                        <h2 className="mb-3 text-xl font-semibold">
                            Original Data (table view)
                        </h2>
                        <div className="max-h-96 overflow-auto rounded-lg border border-slate-800">
                            <table className="min-w-full border-collapse text-sm">
                                <thead className="bg-slate-800">
                                    <tr>
                                        {rawData.header.map((h, idx) => (
                                            <th
                                                key={idx}
                                                className="border-b border-slate-700 px-3 py-2 text-left font-mono text-xs font-semibold"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawData.rows.map((row, i) => (
                                        <tr
                                            key={i}
                                            className={i % 2 === 0 ? "bg-slate-900" : "bg-slate-950"}
                                        >
                                            {rawData.header.map((_, j) => (
                                                <td
                                                    key={j}
                                                    className="border-b border-slate-800 px-3 py-1 font-mono"
                                                >
                                                    {row[j] ?? ""}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

