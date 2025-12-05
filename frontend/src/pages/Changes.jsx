import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { setAuthHeader } from "../api";
import Skeleton from "../components/Skeleton";
import AILoader from "../components/AILoader";

export default function Changes() {
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [docA, setDocA] = useState("");
  const [docB, setDocB] = useState("");

  const [diffLoading, setDiffLoading] = useState(false);
  const [result, setResult] = useState(null);   // { similarity, chunks: [...] }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setAuthHeader(token);
    loadDocs(token);
  }, []);

  const loadDocs = async (token) => {
    try {
      const res = await axios.get("http://localhost:8000/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.documents || [];
      setDocs(list);

      // pre-select first two if available
      if (list.length >= 1) setDocA(list[0]._id);
      if (list.length >= 2) setDocB(list[1]._id);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    } finally {
      setLoadingDocs(false);
    }
  };

  const compare = async () => {
    if (!docA || !docB || docA === docB) {
      alert("Please choose two different documents to compare.");
      return;
    }

    const token = localStorage.getItem("token");
    setDiffLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/documents/compare",
        { doc_id_a: docA, doc_id_b: docB },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (e) {
      alert("Compare failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setDiffLoading(false);
    }
  };

  const renderChunk = (chunk, idx) => {
    const { op, a, b } = chunk;

    if (op === "equal") {
      return (
        <span
          key={idx}
          className="text-sm text-black/80 dark:text-white/80"
        >
          {a}{" "}
        </span>
      );
    }

    if (op === "insert") {
      return (
        <span
          key={idx}
          className="text-sm bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-300 rounded px-1 mx-0.5"
        >
          {b}
        </span>
      );
    }

    if (op === "delete") {
      return (
        <span
          key={idx}
          className="text-sm bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-300 line-through rounded px-1 mx-0.5"
        >
          {a}
        </span>
      );
    }

    // replace
    return (
      <span key={idx} className="inline-flex flex-wrap items-center gap-1 mx-0.5">
        {a && (
          <span
            className="text-sm bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200 line-through rounded px-1"
          >
            {a}
          </span>
        )}
        {b && (
          <span
            className="text-sm bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-300 rounded px-1"
          >
            {b}
          </span>
        )}
      </span>
    );
  };

  return (
    <Layout title="Document Changes">
      <div className="glass-card grad-card p-8 fade-in">
        <h2 className="text-2xl font-semibold mb-6 grad-text">
          Track Changes Between Documents
        </h2>

        {/* Top controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white/80">
              Document A
            </label>

            {loadingDocs ? (
              <Skeleton className="h-11 w-full rounded-lg" />
            ) : (
              <select
                value={docA}
                onChange={(e) => setDocA(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/70 text-black border border-black/10
                  dark:bg-black/30 dark:text-white dark:border-white/20
                  outline-none focus:border-purple-400"
              >
                <option value="">Select document…</option>
                {docs.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.filename}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-black dark:text-white/80">
              Document B
            </label>

            {loadingDocs ? (
              <Skeleton className="h-11 w-full rounded-lg" />
            ) : (
              <select
                value={docB}
                onChange={(e) => setDocB(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/70 text-black border border-black/10
                  dark:bg-black/30 dark:text-white dark:border-white/20
                  outline-none focus:border-purple-400"
              >
                <option value="">Select document…</option>
                {docs.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.filename}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Compare button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={compare}
            disabled={diffLoading || loadingDocs || !docs.length}
            className="px-6 py-3 rounded-xl btn-grad font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            {diffLoading ? (
              <>
                <AILoader label="Comparing…" />
              </>
            ) : (
              <>
                🔍 Compare Versions
              </>
            )}
          </button>

          {!loadingDocs && docs.length === 0 && (
            <span className="text-sm text-black/60 dark:text-white/60">
              No documents uploaded yet. Go to <strong>Upload</strong> first.
            </span>
          )}
        </div>

        {/* Result box */}
        <div
          className="glass-card p-6 rounded-2xl border border-white/10
            bg-white/70 text-black 
            dark:bg-white/5 dark:text-white
            min-h-[200px]"
        >
          {diffLoading && (
            <div className="flex flex-col items-center justify-center gap-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <AILoader label="Analyzing differences..." />
            </div>
          )}

          {!diffLoading && result && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Change Summary
                </h3>
                <div className="text-sm font-medium">
                  Similarity:{" "}
                  <span className="font-bold text-emerald-500 dark:text-emerald-400">
                    {result.similarity}%
                  </span>
                </div>
              </div>

              <div className="text-xs text-black/70 dark:text-white/60 mb-3">
                <span className="inline-block mr-3">
                  <span className="inline-block w-3 h-3 mr-1 rounded bg-green-200 dark:bg-green-500/40" /> Added
                </span>
                <span className="inline-block mr-3">
                  <span className="inline-block w-3 h-3 mr-1 rounded bg-red-200 dark:bg-red-500/40" /> Removed
                </span>
                <span className="inline-block mr-3">
                  <span className="inline-block w-3 h-3 mr-1 rounded bg-yellow-200 dark:bg-yellow-500/40" /> Modified
                </span>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-white/70 text-black 
                dark:bg-black/40 dark:text-white/80
                max-h-72 overflow-auto text-left leading-relaxed"
              >
                {result.chunks.map((chunk, idx) => renderChunk(chunk, idx))}
              </div>
            </>
          )}

          {!diffLoading && !result && (
            <div className="text-sm text-black/60 dark:text-white/60">
              Choose two documents and click <strong>Compare Versions</strong> to see differences.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
