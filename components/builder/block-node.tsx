"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { getBlockDefinition } from "@/lib/blocks/definitions"
import { blockPreview } from "@/lib/blocks/preview"
import { branchHandle, HANDLE_CONTENT, HANDLE_IN, HANDLE_OUT } from "@/lib/flow/graph-to-ast"
import type { BlockNode } from "@/lib/flow/graph-to-ast"
import { cn } from "@/lib/utils"

const CATEGORY_ACCENTS: Record<string, string> = {
  Anchors: "border-l-chart-1",
  Characters: "border-l-chart-2",
  "Character Sets": "border-l-chart-3",
  Quantifiers: "border-l-chart-4",
  Groups: "border-l-chart-5",
  Lookaround: "border-l-chart-1",
  "Special Characters": "border-l-chart-2",
  Advanced: "border-l-chart-3",
}

function BlockNodeComponent({ data, selected }: NodeProps<BlockNode>) {
  const definition = getBlockDefinition(data.blockType)
  const Icon = definition.icon
  const preview = blockPreview(data.blockType, data.settings)
  const branchCount = definition.isBranching ? Math.max(2, data.settings.branches) : 0

  return (
    <div
      className={cn(
        "w-[190px] rounded-lg border border-l-4 bg-card text-card-foreground shadow-sm transition-shadow",
        CATEGORY_ACCENTS[definition.category] ?? "border-l-primary",
        selected ? "ring-2 ring-ring shadow-md" : "hover:shadow-md",
      )}
    >
      <Handle
        type="target"
        id={HANDLE_IN}
        position={Position.Left}
        className="!size-2.5 !border-2 !border-background !bg-muted-foreground"
      />
      <Handle
        type="source"
        id={HANDLE_OUT}
        position={Position.Right}
        className="!size-2.5 !border-2 !border-background !bg-primary"
      />

      <div className="flex items-center gap-2 px-3 pt-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate text-xs font-semibold">{definition.label}</span>
      </div>
      <div className="px-3 pb-2.5 pt-1">
        <code className="block truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
          {preview.length > 0 ? preview : "…"}
        </code>
      </div>

      {definition.isContainer && (
        <>
          <div className="border-t border-dashed px-3 py-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
            content
          </div>
          <Handle
            type="source"
            id={HANDLE_CONTENT}
            position={Position.Bottom}
            className="!size-2.5 !border-2 !border-background !bg-chart-4"
          />
        </>
      )}

      {branchCount > 0 && (
        <>
          <div className="flex border-t border-dashed">
            {Array.from({ length: branchCount }, (_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-dashed py-1 text-center text-[10px] text-muted-foreground last:border-r-0"
              >
                {i + 1}
              </div>
            ))}
          </div>
          {Array.from({ length: branchCount }, (_, i) => (
            <Handle
              key={i}
              type="source"
              id={branchHandle(i)}
              position={Position.Bottom}
              style={{ left: `${((i + 0.5) / branchCount) * 100}%` }}
              className="!size-2.5 !border-2 !border-background !bg-chart-4"
            />
          ))}
        </>
      )}
    </div>
  )
}

export const BlockNodeView = memo(BlockNodeComponent)
