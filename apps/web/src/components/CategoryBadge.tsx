export function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="bg-primary/15 text-primary inline-block rounded-full px-3 py-0.5 text-[11px] font-bold tracking-wider uppercase">
      {label}
    </span>
  );
}
