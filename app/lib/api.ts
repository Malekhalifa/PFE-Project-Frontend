const API_URL = "http://127.0.0.1:8000";

export async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");
    return res.json();
}

export async function analyzeJob(jobId: string) {
    const res = await fetch(`${API_URL}/analyze/${jobId}`, {
        method: "POST",
    });

    if (!res.ok) throw new Error("Analysis failed");
    return res.json();
}

export async function getStatus(jobId: string) {
    const res = await fetch(`${API_URL}/status/${jobId}`);
    if (!res.ok) throw new Error("Status fetch failed");
    return res.json();
}

export async function getResults(jobId: string) {
    const res = await fetch(`${API_URL}/results/${jobId}`);
    if (!res.ok) throw new Error("Results fetch failed");
    return res.json();
}

export async function getRawData(jobId: string) {
    const res = await fetch(`${API_URL}/raw/${jobId}`);
    if (!res.ok) throw new Error("Raw data fetch failed");
    return res.json();
}
