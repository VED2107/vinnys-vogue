"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ExistingImage {
    id: string;
    url: string;
    image_path: string;
}

interface MultiImageUploaderProps {
    existingImages?: ExistingImage[];
    maxImages?: number;
}

export function MultiImageUploader({ existingImages = [], maxImages = 8 }: MultiImageUploaderProps) {
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const transferInputRef = useRef<HTMLInputElement>(null);

    const activeExisting = existingImages.filter((img) => !removedIds.has(img.id));
    const totalCount = activeExisting.length + newFiles.length;

    const addFiles = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
        const remaining = maxImages - totalCount;
        if (remaining <= 0) return;
        setNewFiles((prev) => [...prev, ...arr.slice(0, remaining)]);
    }, [maxImages, totalCount]);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) addFiles(e.target.files);
        e.target.value = "";
    }

    function removeExisting(id: string) {
        setRemovedIds((prev) => new Set(prev).add(id));
    }

    function removeNew(index: number) {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
    }

    // Sync files to a hidden multi-file input for form submission
    // We use DataTransfer to programmatically set files on a file input
    const syncFiles = useCallback(() => {
        if (!transferInputRef.current) return;
        const dt = new DataTransfer();
        newFiles.forEach((f) => dt.items.add(f));
        transferInputRef.current.files = dt.files;
    }, [newFiles]);

    // Sync whenever newFiles changes
    useEffect(() => { syncFiles(); }, [newFiles, syncFiles]);

    return (
        <div className="space-y-3">
            <div className="text-sm font-medium text-zinc-900">
                Product Images
                <span className="text-xs text-zinc-500 ml-2">
                    ({totalCount}/{maxImages})
                </span>
            </div>

            {/* Preview grid */}
            {totalCount > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {/* Existing images */}
                    {activeExisting.map((img, idx) => (
                        <div key={img.id} className="relative group aspect-[4/5] rounded-xl overflow-hidden bg-zinc-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                            {idx === 0 && (
                                <span className="absolute top-1.5 left-1.5 rounded-md bg-zinc-900/70 px-1.5 py-0.5 text-[9px] font-semibold text-white uppercase tracking-wider">
                                    Main
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => removeExisting(img.id)}
                                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* New file previews */}
                    {newFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="relative group aspect-[4/5] rounded-xl overflow-hidden bg-zinc-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={URL.createObjectURL(file)}
                                alt={`New ${idx + 1}`}
                                className="h-full w-full object-cover"
                            />
                            {activeExisting.length === 0 && idx === 0 && (
                                <span className="absolute top-1.5 left-1.5 rounded-md bg-zinc-900/70 px-1.5 py-0.5 text-[9px] font-semibold text-white uppercase tracking-wider">
                                    Main
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => removeNew(idx)}
                                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {/* Add more button */}
                    {totalCount < maxImages && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-[4/5] rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span className="text-[10px] font-medium">Add</span>
                        </button>
                    )}
                </div>
            )}

            {/* Drop zone (shown when no images or as additional area) */}
            {totalCount === 0 && (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all ${dragOver
                        ? "border-zinc-900 bg-zinc-100"
                        : "border-zinc-200 hover:border-zinc-400 bg-zinc-50"
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dragOver ? "#18181b" : "#a1a1aa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <div className="text-sm text-zinc-600 font-medium">
                        {dragOver ? "Drop images here" : "Click or drag images"}
                    </div>
                    <div className="text-xs text-zinc-400">Up to {maxImages} images · First image is the main image</div>
                </div>
            )}

            {/* Hidden file inputs */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* This input carries the new files for form submission */}
            <input
                ref={transferInputRef}
                type="file"
                name="images"
                multiple
                className="hidden"
            />

            {/* Hidden inputs for removed image IDs */}
            {Array.from(removedIds).map((id) => (
                <input key={id} type="hidden" name="removed_image_ids" value={id} />
            ))}

            {/* Hidden inputs for existing image order */}
            {activeExisting.map((img, idx) => (
                <input key={img.id} type="hidden" name="existing_image_ids" value={`${img.id}:${idx}`} />
            ))}
        </div>
    );
}
