"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getResults, getRawData, getReportExport } from "../../lib/api";

export default function ResultsPage() {
    const params = useParams();
    const jobId = params.jobId;

    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState("");
    const [rawData, setRawData] = useState<{ header: string[]; rows: string[][] } | null>(null);
    const [showRaw, setShowRaw] = useState(false);
    const [rawLoading, setRawLoading] = useState(false);
    const [rawError, setRawError] = useState("");
    const [exportLoading, setExportLoading] = useState(false);

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
        column_analysis,
    } = quality_report;

    const formatPercent = (ratio: unknown) => {
        const n = typeof ratio === "number" ? ratio : NaN;
        return Number.isFinite(n) ? `${(n * 100).toFixed(0)}%` : "-";
    };

    const formatNumber = (value: unknown, digits = 2) => {
        const n = typeof value === "number" ? value : NaN;
        return Number.isFinite(n) ? n.toFixed(digits) : "-";
    };

    const handleDownloadReport = async () => {
        try {
            setExportLoading(true);
            const report = await getReportExport(jobId as string);
            const blob = new Blob([JSON.stringify(report, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `analysis-report-${jobId}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setRawError("Failed to download report.");
        } finally {
            setExportLoading(false);
        }
    };

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

    // ====== NEW HELPER: render numeric distribution ======
    const renderDistribution = (dist: any) => {
        if (!dist) return "-";
        return (
            <div className="space-y-1 text-xs">
                <div>
                    <strong>Histogram:</strong> {dist.histogram?.counts?.join(", ")}
                </div>
                <div>
                    <strong>Quantiles:</strong>{" "}
                    0.25={dist.quantiles?.["0.25"]}, 0.5={dist.quantiles?.["0.5"]}, 0.75={dist.quantiles?.["0.75"]}, 0.95={dist.quantiles?.["0.95"]}
                </div>
                <div>
                    <strong>Skewness:</strong> {formatNumber(dist.skewness, 2)}, <strong>Kurtosis:</strong> {formatNumber(dist.kurtosis, 2)}
                </div>
                <div>
                    <strong>Zero Ratio:</strong> {formatPercent(dist.zero_ratio)}
                </div>
                <div>
                    <strong>Constant:</strong> {dist.is_constant ? "Yes" : "No"}, <strong>Near-constant:</strong> {dist.is_near_constant ? "Yes" : "No"}
                </div>
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
            <div className="mx-auto max-w-5xl space-y-8">
                <header>
                    <h1 className="text-3xl font-semibold">
                        Results for Job {jobId}
                    </h1>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleDownloadReport}
                            disabled={exportLoading}
                            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {exportLoading ? "Downloading…" : "Download report"}
                        </button>
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
                                Analyzed Data Summary
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

                        {column_analysis && (
                            <section className="rounded-xl bg-slate-900 p-6 shadow">
                                <h2 className="mb-3 text-xl font-semibold">
                                    Column Analysis
                                </h2>
                                <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-800">
                                    <table className="min-w-full border-collapse text-sm">
                                        <thead className="bg-slate-800">
                                            <tr>
                                                <th className="border-b border-slate-700 px-3 py-2 text-left font-mono text-xs font-semibold">
                                                    Column
                                                </th>
                                                <th className="border-b border-slate-700 px-3 py-2 text-left text-xs font-semibold">
                                                    Type Check
                                                </th>
                                                <th className="border-b border-slate-700 px-3 py-2 text-left text-xs font-semibold">
                                                    Cardinality
                                                </th>
                                                <th className="border-b border-slate-700 px-3 py-2 text-left text-xs font-semibold">
                                                    Missing
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(column_analysis).map(
                                                ([col, a]: any, idx) => {
                                                    const len = a?.string_length;
                                                    const conf = a?.string_format_confidence;
                                                    return (
                                                        <tr
                                                            key={col}
                                                            className={
                                                                idx % 2 === 0
                                                                    ? "bg-slate-900"
                                                                    : "bg-slate-950"
                                                            }
                                                        >
                                                            <td className="border-b border-slate-800 px-3 py-2 font-mono">
                                                                {col}
                                                            </td>
                                                            <td className="border-b border-slate-800 px-3 py-2">
                                                                {a?.type_check ?? "-"}
                                                            </td>
                                                            <td className="border-b border-slate-800 px-3 py-2">
                                                                {a?.cardinality ?? "-"}
                                                            </td>
                                                            <td className="border-b border-slate-800 px-3 py-2">
                                                                {formatNumber(a?.missing_pct, 1)}%
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="mt-3 text-xs text-slate-400">
                                    Email/Date/ID-like values are confidence ratios (share of non-empty values matching a regex).
                                </p>
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
                {column_analysis && (
                    <section className="rounded-xl bg-slate-900 p-6 shadow">
                        <h2 className="mb-3 text-xl font-semibold">Numeric Column Distribution</h2>
                        <div className="space-y-4">
                            {Object.entries(column_analysis).map(([col, a]: any) => {
                                if (a?.inferred_type !== "numeric") return null; // only numeric
                                return (
                                    <div key={col} className="rounded-md border border-slate-700 p-3">
                                        <div className="font-mono font-semibold">{col}</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>Min: {formatNumber(a.min)}</div>
                                            <div>Max: {formatNumber(a.max)}</div>
                                            <div>Mean: {formatNumber(a.mean)}</div>
                                            <div>Median: {formatNumber(a.median)}</div>
                                            <div>Std: {formatNumber(a.std)}</div>
                                            <div className="col-span-2 mt-2">
                                                <strong>Distribution Metrics:</strong>
                                                {renderDistribution(a.distribution)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}

