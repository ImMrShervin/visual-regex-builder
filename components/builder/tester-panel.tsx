"use client"

import { useMemo } from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import type { CompiledRegex } from "@/hooks/use-compiled-regex"
import { useBuilderStore } from "@/store/builder-store"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MatchResult {
  text: string
  index: number
  length: number
  groups: string[]
  namedGroups: Record<string, string>
}

interface TestOutcome {
  matches: MatchResult[]
  error: string | null
}

function runRegex(pattern: string, input: string): TestOutcome {
  if (pattern.length === 0) return { matches: [], error: null }
  let regex: RegExp
  try {
    regex = new RegExp(pattern, "g")
  } catch (error) {
    return { matches: [], error: error instanceof Error ? error.message : "Invalid pattern" }
  }

  const matches: MatchResult[] = []
  let match = regex.exec(input)
  let guard = 0
  while (match !== null && guard < 1000) {
    guard += 1
    matches.push({
      text: match[0],
      index: match.index,
      length: match[0].length,
      groups: match.slice(1).map((group) => group ?? ""),
      namedGroups: match.groups !== undefined ? { ...(match.groups as Record<string, string>) } : {},
    })
    if (match[0].length === 0) regex.lastIndex += 1
    match = regex.exec(input)
  }
  return { matches, error: null }
}

function HighlightedInput({ input, matches }: { input: string; matches: MatchResult[] }) {
  if (input.length === 0) {
    return <p className="text-xs text-muted-foreground">Type test input above to see matches highlighted.</p>
  }
  const parts: React.ReactNode[] = []
  let cursor = 0
  matches.forEach((match, i) => {
    if (match.index > cursor) {
      parts.push(<span key={`t-${i}`}>{input.slice(cursor, match.index)}</span>)
    }
    parts.push(
      <mark key={`m-${i}`} className="rounded-sm bg-primary/20 px-0.5 text-foreground ring-1 ring-primary/40">
        {input.slice(match.index, match.index + match.length)}
      </mark>,
    )
    cursor = match.index + match.length
  })
  if (cursor < input.length) {
    parts.push(<span key="tail">{input.slice(cursor)}</span>)
  }
  return (
    <p className="whitespace-pre-wrap break-all font-mono text-sm leading-relaxed">{parts}</p>
  )
}

function MatchDetails({ matches }: { matches: MatchResult[] }) {
  return (
    <div className="flex flex-col gap-2">
      {matches.map((match, i) => (
        <div key={i} className="rounded-md border bg-card p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[11px]">
              {`"${match.text}"`}
            </Badge>
            <span className="text-xs text-muted-foreground">
              index {match.index} · length {match.length}
            </span>
          </div>
          {match.groups.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {match.groups.map((group, gi) => (
                <span key={gi} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  {`$${gi + 1} = "${group}"`}
                </span>
              ))}
            </div>
          )}
          {Object.keys(match.namedGroups).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {Object.entries(match.namedGroups).map(([name, groupValue]) => (
                <span key={name} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  {`${name} = "${groupValue ?? ""}"`}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function TesterPanel({ compiled }: { compiled: CompiledRegex }) {
  const testInput = useBuilderStore((state) => state.testInput)
  const setTestInput = useBuilderStore((state) => state.setTestInput)
  const { pattern, explanation } = compiled

  const outcome = useMemo(() => runRegex(pattern, testInput), [pattern, testInput])
  const hasMatch = outcome.matches.length > 0

  return (
    <Tabs defaultValue="tester" className="flex h-full flex-col gap-0">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <TabsList>
          <TabsTrigger value="tester">Tester</TabsTrigger>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
        </TabsList>
        {pattern.length > 0 && (
          <div className="flex items-center gap-1.5">
            {hasMatch ? (
              <>
                <CheckCircle2 className="size-4 text-chart-2" aria-hidden="true" />
                <span className="text-xs font-medium">
                  {outcome.matches.length} match{outcome.matches.length === 1 ? "" : "es"}
                </span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-destructive" aria-hidden="true" />
                <span className="text-xs font-medium text-muted-foreground">No match</span>
              </>
            )}
          </div>
        )}
      </div>

      <TabsContent value="tester" className="min-h-0 flex-1">
        <div className="grid h-full grid-cols-1 gap-0 md:grid-cols-2">
          <div className="flex min-h-0 flex-col gap-2 border-r p-3">
            <label htmlFor="test-input" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Test Input
            </label>
            <Textarea
              id="test-input"
              value={testInput}
              onChange={(event) => setTestInput(event.target.value)}
              placeholder="hello123"
              className="min-h-0 flex-1 resize-none font-mono text-sm"
            />
            {outcome.error !== null && (
              <p className="text-xs text-destructive" role="alert">
                {outcome.error}
              </p>
            )}
          </div>
          <ScrollArea className="min-h-0">
            <div className="flex flex-col gap-3 p-3">
              <div>
                <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Highlighted
                </h4>
                <HighlightedInput input={testInput} matches={outcome.matches} />
              </div>
              {hasMatch && (
                <div>
                  <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Matches
                  </h4>
                  <MatchDetails matches={outcome.matches} />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      <TabsContent value="explanation" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-0.5 p-3">
            {explanation.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add blocks to the canvas and the pattern will be explained here, piece by piece.
              </p>
            ) : (
              explanation.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-3 rounded-md px-2 py-1 hover:bg-muted/60"
                  style={{ paddingLeft: `${8 + entry.depth * 16}px` }}
                >
                  <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {entry.token}
                  </code>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {entry.description}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}
