"use client";

import { useState } from "react";

import { ImageIcon, Loader2, PenTool } from "lucide-react";
import Link from "next/link";

import { AuthModal } from "@/components/auth/AuthModal";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { TopBar } from "@/components/shared/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { useSketches } from "@/hooks/useSketches";

export default function GalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  if (authLoading) {
    return (
      <>
        <TopBar />
        <main className="flex min-h-[60vh] items-center justify-center">
          <Loader2
            size={32}
            className="animate-spin text-[var(--muted-foreground)]"
          />
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <TopBar />
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--panel-elevated)] text-[var(--muted-foreground)]">
            <ImageIcon size={28} />
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Sign in to view your sketches
          </h2>
          <p className="max-w-md text-sm text-[var(--muted-foreground)]">
            Save your drawings and access them anytime from your personal
            gallery.
          </p>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Sign In
          </button>
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </main>
      </>
    );
  }

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

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Your Sketches
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              Gallery
            </h1>
            {total > 0 && (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {total} sketch{total === 1 ? "" : "es"}
              </p>
            )}
          </div>

          <Link
            href="/canvas"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            <PenTool size={16} />
            New Sketch
          </Link>
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
            items={items}
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
