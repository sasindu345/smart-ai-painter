"use client";

import { useState } from "react";

import { Loader2, PenTool } from "lucide-react";
import Link from "next/link";

import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { TopBar } from "@/components/shared/TopBar";
import { useSketches } from "@/hooks/useSketches";

export default function GalleryPage() {
  return (
    <>
      <TopBar />
      <GalleryContent />
    </>
  );
}

function GalleryContent() {
  const {
    items,
    total,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    deleteSketch,
  } = useSketches();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [presetFilter, setPresetFilter] = useState("all");

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = item.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPreset =
        presetFilter === "all" || item.pagePreset === presetFilter;
      return matchesSearch && matchesPreset;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Back navigation button */}
        <div className="mb-6 flex lg:hidden">
          <Link
            href="/canvas"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4.5 py-2 text-xs font-bold text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all shadow-sm"
          >
            ← Back to Canvas Studio
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Your Sketches
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              Gallery
            </h1>
            {total > 0 && (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {filteredItems.length} of {total} sketch
                {total === 1 ? "" : "es"} shown
              </p>
            )}
          </div>

          <div className="flex shrink-0">
            <Link
              href="/canvas"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
            >
              <PenTool size={16} />
              New Sketch
            </Link>
          </div>
        </div>

        {/* Search, Sort & Filters controls bar */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-3.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Clear
              </button>
            )}
          </div>

          <div>
            <select
              value={presetFilter}
              onChange={(e) => setPresetFilter(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition"
            >
              <option value="all">All Sizes (Presets)</option>
              <option value="square">Square (1:1)</option>
              <option value="landscape">Landscape (16:9)</option>
              <option value="portrait">Portrait (9:16)</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition"
            >
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2
              size={32}
              className="animate-spin text-[var(--muted-foreground)]"
            />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">
              Failed to load sketches. Please try again.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <GalleryGrid
            items={filteredItems}
            hasNextPage={hasNextPage ?? false}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            onDelete={deleteSketch}
          />
        )}
      </div>
    </main>
  );
}
