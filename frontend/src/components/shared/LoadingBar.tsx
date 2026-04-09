"use client";

export function LoadingBar() {
  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-label="Loading"
      className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]"
    >
      <div className="h-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-[var(--accent)]" />
      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(200%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
