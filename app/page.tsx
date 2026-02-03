"use client";

import { useState } from "react";
import { uploadFile } from "@/app/lib/api";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setError("");
      setLoading(true);
      const res = await uploadFile(file);
      router.push(`/analyze/${res.job_id}`);
    } catch (e) {
      setError("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-md rounded-xl bg-slate-900 p-8 shadow-lg shadow-slate-900/50">
        <h1 className="mb-4 text-2xl font-semibold">Upload CSV</h1>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 block w-full text-sm text-slate-200
                     file:mr-4 file:rounded-md file:border-0
                     file:bg-sky-600 file:px-4 file:py-2
                     file:text-sm file:font-semibold
                     hover:file:bg-sky-500"
        />

        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className={`flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold
                     ${loading ? "bg-slate-700 cursor-wait" : "bg-sky-600 hover:bg-sky-500"}
                     disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {loading && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent" />
          )}
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
