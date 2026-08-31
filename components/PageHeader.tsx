export function PageHeader({
  label,
  title,
  description,
  count,
}: {
  label: string
  title: string
  description?: string
  count?: number
}) {
  return (
    <header className="py-10 sm:py-14">
      <p className="font-mono text-[0.7rem] tracking-[0.2em] text-ink-faint uppercase">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">{title}</h1>
        {count !== undefined && (
          <span className="font-mono text-sm text-ink-faint tabular-nums">{count}건</span>
        )}
      </div>
      {description && (
        <p className="mt-3 max-w-(--measure) text-sm leading-relaxed text-ink-soft">{description}</p>
      )}
    </header>
  )
}
