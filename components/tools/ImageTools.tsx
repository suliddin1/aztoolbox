"use client";

import { useState } from "react";
import { CvPhotoMaker } from "@/components/tools/CvPhotoMaker";
import { ImageCompressor } from "@/components/tools/ImageCompressor";
import { ImageFormatConverter } from "@/components/tools/ImageFormatConverter";
import { ImageResizer } from "@/components/tools/ImageResizer";

type Tab = "resize" | "compress" | "cv" | "convert";

const tabs: Array<[Tab, string]> = [
  ["resize", "Ölçüləndir"],
  ["compress", "Sıxışdır"],
  ["cv", "CV şəkli"],
  ["convert", "Format çevir"],
];

export function ImageTools() {
  const [activeTab, setActiveTab] = useState<Tab>("resize");

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-line bg-surface p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-4">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`h-11 rounded-md px-3 text-sm font-semibold transition ${
                activeTab === value
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:bg-surface-soft hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "resize" ? <ImageResizer /> : null}
      {activeTab === "compress" ? <ImageCompressor /> : null}
      {activeTab === "cv" ? <CvPhotoMaker /> : null}
      {activeTab === "convert" ? <ImageFormatConverter /> : null}
    </div>
  );
}
