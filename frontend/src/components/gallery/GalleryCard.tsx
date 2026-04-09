"use client";

import { useState } from "react";

import { Download, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import type { Sketch } from "@/types/sketch";

interface GalleryCardProps {
  sketch: Sketch;
  onDelete: (id: string) => void;
}

export function GalleryCard({ sketch, onDelete }: GalleryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = new Date(sketch.createdAt).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <div className="group overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--panel-elevated)] transition hover:border-[var(--accent)]/40 hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--panel)]">
        <img
          src={sketch.imageUrl}
          alt={sketch.title}
          className="h-full w-full object-contain transition group-hover:scale-[1.02]"
          loading="lazy"
        />

        {/* Overlay actions */}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">
          <div className="flex w-full items-center justify-between p-3">
            <div className="flex items-center gap-1.5">
              {/* Edit — re-open in canvas */}
              <Link
                href={`/canvas?sketch=${sketch.id}`}
                aria-label={`Edit ${sketch.title} in canvas`}
                className="rounded-xl bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                title="Edit in Canvas"
              >
                <Pencil size={16} />
              </Link>

              {/* Download */}
              <a
                href={sketch.imageUrl}
                download={`${sketch.title}.png`}
                aria-label={`Download ${sketch.title}`}
                className="rounded-xl bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                title="Download"
              >
                <Download size={16} />
              </a>
            </div>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-xl bg-white/20 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm transition hover:bg-white/30"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(sketch.id)}
                  className="rounded-xl bg-red-500/80 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm transition hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label={`Delete ${sketch.title}`}
                className="rounded-xl bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-red-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">
          {sketch.title}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="rounded-lg bg-[var(--panel)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
            {sketch.pagePreset}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
