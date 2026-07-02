"use client"

import { useState } from "react"
import { FolderInput } from "lucide-react"
import type { Edge } from "@xyflow/react"
import { tryParseRegex } from "@/lib/regex/parser"
import { astToGraph } from "@/lib/flow/ast-to-graph"
import type { AstNode } from "@/lib/regex/ast"
import type { BlockNode } from "@/lib/flow/graph-to-ast"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type ImportMode = "regex" | "json" | "ast"

function isGraphJson(value: unknown): value is { nodes: BlockNode[]; edges: Edge[] } {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as { nodes?: unknown; edges?: unknown }
  return Array.isArray(candidate.nodes) && Array.isArray(candidate.edges)
}

export function ImportDialog() {
  const importGraph = useBuilderStore((state) => state.importGraph)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ImportMode>("regex")
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)

  const placeholders: Record<ImportMode, string> = {
    regex: "^\\d{3}-\\d{4}$",
    json: '{ "nodes": [...], "edges": [...] }',
    ast: '{ "type": "sequence", "children": [...] }',
  }

  function handleImport(): void {
    setError(null)
    const input = value.trim()
    if (input.length === 0) {
      setError("Paste something to import first.")
      return
    }

    try {
      if (mode === "regex") {
        const pattern = input.startsWith("/") ? input.replace(/^\/|\/[a-z]*$/g, "") : input
        const result = tryParseRegex(pattern)
        if (!result.ok) {
          setError(result.error)
          return
        }
        const { nodes, edges } = astToGraph(result.ast)
        importGraph(nodes, edges)
      } else if (mode === "json") {
        const parsed: unknown = JSON.parse(input)
        if (!isGraphJson(parsed)) {
          setError('Expected a JSON object with "nodes" and "edges" arrays.')
          return
        }
        importGraph(parsed.nodes, parsed.edges)
      } else {
        const parsed: unknown = JSON.parse(input)
        if (typeof parsed !== "object" || parsed === null || !("type" in parsed)) {
          setError('Expected an AST object with a "type" field.')
          return
        }
        const { nodes, edges } = astToGraph(parsed as AstNode)
        importGraph(nodes, edges)
      }
      setValue("")
      setOpen(false)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <FolderInput className="size-3.5" />
        Import
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import</DialogTitle>
          <DialogDescription>
            Import an existing regex, a project JSON file, or a raw AST. This replaces the current
            canvas.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(newMode) => {
            setMode(newMode as ImportMode)
            setError(null)
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="regex">Regex</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="ast">AST</TabsTrigger>
          </TabsList>
          <TabsContent value={mode}>
            <Textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholders[mode]}
              rows={mode === "regex" ? 3 : 8}
              className="font-mono text-xs"
              aria-label={`Import ${mode}`}
            />
          </TabsContent>
        </Tabs>

        {error !== null && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button size="sm" onClick={handleImport}>
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
