"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStatus, analyzeJob } from "../../lib/api";

export default function AnalyzePage() {
    const params = useParams();
    const jobId = params.jobId;
    const router = useRouter();

    if (!jobId || Array.isArray(jobId)) {
        return <p style={{ color: "red" }}>Invalid Job ID</p>;
    }

    const [status, setStatus] = useState("starting");
    const [error, setError] = useState("");

    useEffect(() => {

        // Start analysis
        analyzeJob(jobId).catch((e) => setError("Failed to start analysis"));

        const interval = setInterval(async () => {
            try {
                const res = await getStatus(jobId);
                setStatus(res.status);
                if (res.status === "completed") {
                    clearInterval(interval);
                    router.push(`/results/${jobId}`);
                } else if (res.status === "failed") {
                    clearInterval(interval);
                    setError("Job failed");
                }
            } catch {
                setError("Error fetching status");
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId, router]);

    return (
        <div>
            <h1>Analyzing Job {jobId}</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <p>Status: {status}</p>
        </div>
    );
}
