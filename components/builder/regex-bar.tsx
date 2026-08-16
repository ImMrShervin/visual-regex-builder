"use client"

import { useState } from "react"
import { AlertTriangle, Check, Copy } from "lucide-react"
import type { CompiledRegex } from "@/hooks/use-compiled-regex"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ExportDialog } from "./export-dialog"
import { ImportDialog } from "./import-dialog"
import { PatternLibrary } from "./pattern-library"

export function RegexBar({ compiled }: { compiled: CompiledRegex }) {
  const [copied, setCopied] = useState(false)
  const { pattern, warnings, error, ast } = compiled

  return (
    <div className="flex flex-col gap-1 border-b bg-background px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Generated Regex
        </span>
        <div className="flex min-w-0 flex-1 items-center rounded-md border bg-muted/50 px-2.5 py-1.5">
          <code className="truncate font-mono text-sm" aria-live="polite">
            {pattern.length > 0 ? (
              <>
                <span className="text-muted-foreground">/</span>
                {pattern}
                <span className="text-muted-foreground">/</span>
              </>
            ) : (
              <span className="text-muted-foreground">Drag blocks onto the canvas to build a pattern…</span>
            )}
          </code>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={pattern.length === 0}
          onClick={() => {
            void navigator.clipboard.writeText(pattern).then(() => {
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            })
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <PatternLibrary />
        <ImportDialog />
        <ExportDialog pattern={pattern} ast={ast} />
      </div>

      {(error !== null || warnings.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {error !== null && (
            <Badge variant="destructive" className="gap-1 text-[11px]">
              <AlertTriangle className="size-3" aria-hidden="true" />
              {error}
            </Badge>
          )}
          {warnings.map((warning) => (
            <Tooltip key={warning}>
              <TooltipTrigger
                render={
                  <Badge variant="secondary" className="gap-1 text-[11px]">
                    <AlertTriangle className="size-3 text-chart-4" aria-hidden="true" />
                    {warning}
                  </Badge>
                }
              />
              <TooltipContent>{warning}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  )
}
