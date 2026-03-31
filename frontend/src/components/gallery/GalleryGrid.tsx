"use client";

import { useCallback, useEffect, useRef } from "react";

import { Loader2 } from "lucide-react";

import type { Sketch } from "@/types/sketch";

import { GalleryCard } from "./GalleryCard";

interface GalleryGridProps {
  items: Sketch[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onDelete: (id: string) => void;
}

export function GalleryGrid({
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onDelete,
}: GalleryGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleIntersect]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-[var(--foreground)]">
          No sketches yet
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Head to the canvas, draw something, and hit Save Sketch.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <GalleryCard key={item.id} sketch={item} onDelete={onDelete} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

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
