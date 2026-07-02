"use client"

import { useMemo, useState } from "react"
import { BookOpen, Search } from "lucide-react"
import {
  PATTERN_CATEGORIES,
  PATTERN_PRESETS,
  type PatternPreset,
} from "@/lib/patterns"
import { tryParseRegex } from "@/lib/regex/parser"
import { astToGraph } from "@/lib/flow/ast-to-graph"
import { useBuilderStore } from "@/store/builder-store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

function PresetCard({
  preset,
  onApply,
}: {
  preset: PatternPreset
  onApply: (preset: PatternPreset) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onApply(preset)}
      className="flex w-full flex-col gap-1 rounded-md border bg-card p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-accent"
    >
      <span className="text-xs font-semibold text-card-foreground">{preset.name}</span>
      <span className="text-[11px] leading-relaxed text-muted-foreground">
        {preset.description}
      </span>
      <code className="mt-0.5 truncate rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
        {preset.pattern}
      </code>
    </button>
  )
}

export function PatternLibrary() {
  const importGraph = useBuilderStore((state) => state.importGraph)
  const setTestInput = useBuilderStore((state) => state.setTestInput)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered =
      q.length === 0
        ? PATTERN_PRESETS
        : PATTERN_PRESETS.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q) ||
              p.pattern.toLowerCase().includes(q),
          )
    return PATTERN_CATEGORIES.map((category) => ({
      category,
      presets: filtered.filter((p) => p.category === category),
    })).filter((group) => group.presets.length > 0)
  }, [query])

  function handleApply(preset: PatternPreset): void {
    setError(null)
    const result = tryParseRegex(preset.pattern)
    if (!result.ok) {
      setError(`Could not load "${preset.name}": ${result.error}`)
      return
    }
    const { nodes, edges } = astToGraph(result.ast)
    importGraph(nodes, edges)
    setTestInput(preset.sampleInput)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setQuery("")
          setError(null)
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <BookOpen className="size-3.5" />
        Patterns
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Pattern library</DialogTitle>
          <DialogDescription>
            Start from a ready-made pattern. Applying one replaces the current canvas and fills the
            tester with a sample input.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patterns…"
            className="h-8 pl-7 text-xs"
            aria-label="Search patterns"
          />
        </div>

        {error !== null && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <ScrollArea className="max-h-[55dvh] min-h-0">
          <div className="flex flex-col gap-4 pb-2 pr-3">
            {grouped.map(({ category, presets }) => (
              <section key={category} aria-label={category}>
                <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {presets.map((preset) => (
                    <PresetCard key={preset.id} preset={preset} onApply={handleApply} />
                  ))}
                </div>
              </section>
            ))}
            {grouped.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No patterns match your search.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
