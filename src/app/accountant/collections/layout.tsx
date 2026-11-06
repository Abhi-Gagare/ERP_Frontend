// These routes verify the session in the shared client layout before rendering.
// They intentionally allow blocking navigation rather than claim instant UI.
export const instant = false;

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
