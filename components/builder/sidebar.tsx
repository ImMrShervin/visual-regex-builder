"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import {
  BLOCK_CATEGORIES,
  BLOCK_DEFINITIONS,
  type BlockDefinition,
  type BlockType,
} from "@/lib/blocks/definitions"
import { useBuilderStore } from "@/store/builder-store"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export const DRAG_MIME = "application/x-regex-block"

function SidebarItem({ definition }: { definition: BlockDefinition }) {
  const addBlock = useBuilderStore((state) => state.addBlock)
  const Icon = definition.icon

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(DRAG_MIME, definition.type satisfies BlockType)
              event.dataTransfer.effectAllowed = "move"
            }}
            onClick={() => {
              const { nodes } = useBuilderStore.getState()
              if (nodes.length === 0) {
                addBlock(definition.type, { x: 80, y: 120 })
              } else {
                const rightMost = nodes.reduce((max, node) =>
                  node.position.x > max.position.x ? node : max,
                )
                addBlock(
                  definition.type,
                  {
                    x: rightMost.position.x + 200,
                    y: rightMost.position.y,
                  },
                  { connectFrom: rightMost.id },
                )
              }
            }}
            className="flex w-full cursor-grab items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-left text-xs font-medium text-card-foreground transition-colors hover:border-primary/50 hover:bg-accent active:cursor-grabbing"
          />
        }
      >
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">{definition.label}</span>
      </TooltipTrigger>
      <TooltipContent side="right">{definition.description}</TooltipContent>
    </Tooltip>
  )
}

export function BuilderSidebar() {
  const [query, setQuery] = useState("")

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered =
      q.length === 0
        ? BLOCK_DEFINITIONS
        : BLOCK_DEFINITIONS.filter(
            (d) =>
              d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q),
          )
    return BLOCK_CATEGORIES.map((category) => ({
      category,
      blocks: filtered.filter((d) => d.category === category),
    })).filter((group) => group.blocks.length > 0)
  }, [query])

  return (
    <aside className="flex h-full flex-col bg-background" aria-label="Block palette">
      <div className="border-b p-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search blocks…"
            className="h-8 pl-7 text-xs"
            aria-label="Search blocks"
          />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-2 pb-6">
          {grouped.map(({ category, blocks }) => (
            <section key={category} aria-label={category}>
              <h3 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h3>
              <div className="flex flex-col gap-1">
                {blocks.map((definition) => (
                  <SidebarItem key={definition.type} definition={definition} />
                ))}
              </div>
            </section>
          ))}
          {grouped.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">
              No blocks match your search.
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
