"use client";

import { useState } from "react";

import { Download, ImageIcon, Loader2, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";

import { AuthModal } from "@/components/auth/AuthModal";
import { TopBar } from "@/components/shared/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { useGallery } from "@/hooks/useGallery";
import type { Generation } from "@/types/gallery";

export default function GeneratePage() {
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
            <Sparkles size={28} />
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Sign in to view your generations
          </h2>
          <p className="max-w-md text-sm text-[var(--muted-foreground)]">
            Your AI-generated artworks are saved here when you generate while
            signed in.
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
      <GenerateContent />
    </>
  );
}

function GenerateContent() {
  const {
    items,
    total,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    deleteGeneration,
  } = useGallery();

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              AI Artwork
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              Generated Images
            </h1>
            {total > 0 && (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {total} generation{total === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <Link
            href="/canvas"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            <Sparkles size={16} />
            Generate New
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
              Failed to load generations. Please try again.
            </p>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium text-[var(--foreground)]">
              No generated images yet
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Go to the canvas, draw a sketch, and use AI Preview to generate
              artwork.
            </p>
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <GenerationGrid
            items={items}
            hasNextPage={hasNextPage ?? false}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            onDelete={deleteGeneration}
          />
        )}
      </div>
    </main>
  );
}

function GenerationGrid({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onDelete,
}: {
  items: Generation[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <GenerationCard key={item.id} generation={item} onDelete={onDelete} />
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Loader2
            size={24}
            className="animate-spin text-[var(--muted-foreground)]"
          />
        </div>
      )}
    </>
  );
}

function GenerationCard({
  generation,
  onDelete,
}: {
  generation: Generation;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedDate = new Date(generation.createdAt).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <div className="group overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--panel-elevated)] transition hover:border-[var(--accent)]/40 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-[var(--panel)]">
        <img
          src={generation.imageUrl}
          alt={generation.prompt}
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          loading="lazy"
        />

        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">
          <div className="flex w-full items-center justify-between p-3">
            <a
              href={generation.imageUrl}
              download={`generation-${generation.id}.png`}
              className="rounded-xl bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30"
              title="Download"
            >
              <Download size={16} />
            </a>

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
                  onClick={() => onDelete(generation.id)}
                  className="rounded-xl bg-red-500/80 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm transition hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-xl bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-red-500/60"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-3">
        <p className="line-clamp-2 text-sm text-[var(--foreground)]">
          {generation.prompt}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded-lg bg-[var(--panel)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
            {generation.style}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
