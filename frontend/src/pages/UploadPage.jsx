import React, { useState } from "react";
import axios from "axios";
import { setAuthHeader } from "../api";
import Layout from "../components/Layout";
import Skeleton from "../components/Skeleton";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  const token = localStorage.getItem("token");
  if (!token) window.location.href = "/";
  setAuthHeader(token);

  const upload = async () => {
    if (!file) {
      alert("Please choose a file");
      return;
    }

    setProcessing(true);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/api/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data.message + (res.data.duplicate ? " (duplicate)" : ""));
      setFile(null);
    } catch (e) {
      alert("Upload failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout title="Upload Document">
      <div className="glass-card grad-card card-hover p-10 fade-in">

        <h3 className="text-2xl font-semibold mb-6 
          text-black dark:text-white grad-text">
          Upload your files
        </h3>

        {/* Drag & Drop */}
        <div
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-black/20 
          dark:border-white/20 rounded-xl p-10 text-center 
          text-black dark:text-white/70 
          hover:border-purple-400 hover:text-purple-500 dark:hover:text-purple-300
          transition-all cursor-pointer"
        >
          {file ? (
            <div className="text-black dark:text-white text-lg">
              {file.name}
            </div>
          ) : (
            <>
              <div className="text-5xl mb-3 text-black dark:text-white">📄</div>
              <p className="text-black dark:text-white">Drag & drop your file here</p>
              <p className="text-black/60 dark:text-white/50 text-sm">(or browse below)</p>
            </>
          )}
        </div>

        {/* File Input + Upload Button */}
        <div className="mt-6 flex items-center gap-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="bg-white/60 dark:bg-white/10 
            text-black dark:text-white 
            border border-black/20 dark:border-white/20 
            rounded-lg p-2"
          />

          <button
            className="px-6 py-2 rounded-lg btn-grad ripple text-white"
            onClick={upload}
            disabled={processing}
          >
            {processing ? "Processing…" : "Upload"}
          </button>
        </div>

        {/* Processing Overlay */}
        {processing && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="glass-card p-6 rounded-xl border border-white/10 w-[480px] text-center">

              <div className="text-xl font-semibold mb-4 
                text-black dark:text-white grad-text">
                Processing your file…
              </div>

              <Skeleton className="h-3 w-full mb-3" />
              <Skeleton className="h-3 w-4/5 mb-3" />
              <Skeleton className="h-3 w-1/2" />

              <div className="mt-6 text-black/60 dark:text-white/60 text-sm">
                Do not close this window.
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
