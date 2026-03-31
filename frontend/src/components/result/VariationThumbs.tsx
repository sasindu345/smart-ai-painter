"use client";

type VariationThumbsProps = {
  images: string[]; // base64 strings
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function VariationThumbs({
  images,
  activeIndex,
  onSelect,
}: VariationThumbsProps) {
  if (images.length <= 1) return null;

  return (
    <div className="flex gap-2">
      {images.map((img, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={`overflow-hidden rounded-xl border-2 transition ${
            i === activeIndex
              ? "border-[var(--accent)] shadow-md"
              : "border-[var(--border)] opacity-70 hover:opacity-100"
          }`}
        >
          <img
            src={`data:image/png;base64,${img}`}
            alt={`Variation ${i + 1}`}
            className="h-16 w-16 object-cover"
          />
        </button>
      ))}
    </div>
  );
}
