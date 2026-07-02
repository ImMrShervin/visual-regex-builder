"use client"

import { useState } from "react"
import { Check, Copy, Download, FileJson, Share } from "lucide-react"
import { EXPORT_TARGETS, exportSnippet, type ExportLanguage } from "@/lib/regex/exporters"
import { useBuilderStore } from "@/store/builder-store"
import type { AstNode } from "@/lib/regex/ast"
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

interface ExportDialogProps {
  pattern: string
  ast: AstNode
}

function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        })
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  )
}

export function ExportDialog({ pattern, ast }: ExportDialogProps) {
  const [language, setLanguage] = useState<ExportLanguage>("javascript")
  const snippet = exportSnippet(language, pattern)

  const graphJson = (): string => {
    const { nodes, edges } = useBuilderStore.getState()
    return JSON.stringify({ nodes, edges }, null, 2)
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share className="size-3.5" />
        Export
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>
            Copy a code snippet or download your project as JSON.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={language}
          onValueChange={(value) => setLanguage(value as ExportLanguage)}
        >
          <TabsList className="w-full">
            {EXPORT_TARGETS.map((target) => (
              <TabsTrigger key={target.id} value={target.id}>
                {target.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {EXPORT_TARGETS.map((target) => (
            <TabsContent key={target.id} value={target.id}>
              <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
                {exportSnippet(target.id, pattern)}
              </pre>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex flex-wrap gap-2">
          <CopyButton text={pattern} label="Copy Regex" />
          <CopyButton text={snippet} label="Copy Snippet" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadFile("regex-project.json", graphJson(), "application/json")}
          >
            <FileJson className="size-3.5" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadFile("regex-ast.json", JSON.stringify(ast, null, 2), "application/json")
            }
          >
            <Download className="size-3.5" />
            Export AST
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
