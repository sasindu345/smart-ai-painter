import { Suspense } from "react";

import { CanvasWorkspaceShell } from "@/components/canvas/CanvasWorkspaceShell";

export default function CanvasPage() {
  return (
    <Suspense>
      <CanvasWorkspaceShell />
    </Suspense>
  );
}
