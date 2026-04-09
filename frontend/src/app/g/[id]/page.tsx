import type { Metadata } from "next";
import Link from "next/link";

import { TopBar } from "@/components/shared/TopBar";

interface SharedGenerationPageProps {
  params: {
    id: string;
  };
}

interface PublicGeneration {
  id: string;
  prompt: string;
  style: string;
  image_url: string;
  created_at: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://smart-ai-painter.vercel.app";

async function fetchGeneration(id: string): Promise<PublicGeneration | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/gallery/public/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicGeneration;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: SharedGenerationPageProps): Promise<Metadata> {
  const generation = await fetchGeneration(params.id);

  if (!generation) {
    return {
      title: "Shared artwork — Smart AI Painter",
      description: "AI-generated artwork created with Smart AI Painter.",
    };
  }

  const title = `"${generation.prompt}" — Smart AI Painter`;
  const description = `An AI-generated ${generation.style} artwork created from a sketch with Smart AI Painter.`;
  const url = `${SITE_URL}/g/${generation.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Smart AI Painter",
      type: "article",
      images: [
        {
          url: generation.image_url,
          width: 1024,
          height: 1024,
          alt: generation.prompt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [generation.image_url],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function SharedGenerationPage({
  params,
}: SharedGenerationPageProps) {
  const generation = await fetchGeneration(params.id);

  if (!generation) {
    return (
      <>
        <TopBar />
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Generation not found
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            This artwork may have been removed or the link is incorrect.
          </p>
          <Link
            href="/canvas"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Open canvas
          </Link>
        </main>
      </>
    );
  }

  const formattedDate = new Date(generation.created_at).toLocaleDateString(
    undefined,
    { month: "long", day: "numeric", year: "numeric" },
  );

  return (
    <>
      <TopBar />
      <main className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8">
        <article className="mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--panel-elevated)] p-3 shadow-[0_30px_120px_rgba(15,23,42,0.10)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generation.image_url}
              alt={generation.prompt}
              className="w-full rounded-[24px] border border-[var(--border)]"
            />
          </div>

          <aside className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Shared Artwork
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              {generation.prompt}
            </h1>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Style
                </dt>
                <dd className="mt-1 capitalize text-[var(--foreground)]">
                  {generation.style}
                </dd>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-elevated)] p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Created
                </dt>
                <dd className="mt-1 text-[var(--foreground)]">{formattedDate}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/canvas"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
              >
                Try Smart AI Painter
              </Link>
              <a
                href={generation.image_url}
                download={`generation-${generation.id}.png`}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-elevated)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Download
              </a>
            </div>
          </aside>
        </article>
      </main>
    </>
  );
}
