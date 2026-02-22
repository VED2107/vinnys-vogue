"use client";

import { useState, useRef } from "react";

interface ImageUploadInputProps {
    name: string;
    defaultValue: string;
    label: string;
    sublabel?: string;
}

export function ImageUploadInput({ name, defaultValue, label, sublabel }: ImageUploadInputProps) {
    const [url, setUrl] = useState(defaultValue || "");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const inputClass =
        "w-full rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-3 text-[14px] text-heading outline-none transition focus:border-gold";
    const labelClass = "block text-[13px] font-medium text-heading mb-1.5";

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "site");

            const res = await fetch("/api/upload/site-image", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Upload failed");
                return;
            }

            setUrl(data.url);
        } catch {
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <label className={labelClass}>
                {label}
                {sublabel ? <span className="text-muted font-normal"> ({sublabel})</span> : null}
            </label>

            {/* Hidden real input that the form reads */}
            <input type="hidden" name={name} value={url} />

            {/* URL text input */}
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputClass}
                placeholder="https://..."
            />

            {/* Upload from device */}
            <div className="mt-2 flex items-center gap-3">
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
                >
                    {uploading ? (
                        <>
                            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v4m0 12v4m-8-10H2m20 0h-4m-2.343-5.657L14.828 4.1m-5.656 15.8-1.414 1.414m12.728 0-1.414-1.414M4.1 9.172l-1.414-1.414" />
                            </svg>
                            Uploading...
                        </>
                    ) : (
                        <>
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                            Upload from device
                        </>
                    )}
                </button>

                {url && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-gold underline"
                    >
                        Preview
                    </a>
                )}
                {url && (
                    <button
                        type="button"
                        onClick={() => { setUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-100"
                    >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                        Remove
                    </button>
                )}
            </div>

            {/* Small preview */}
            {url && (
                <div className="mt-2 relative w-16 h-16 overflow-hidden rounded-lg border border-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                </div>
            )}

            {error && (
                <p className="mt-1 text-[12px] text-red-500">{error}</p>
            )}
        </div>
    );
}
