"use client"

import { useTheme } from "next-themes"
import { Moon, Redo2, Regex, Sun, Trash2, Undo2 } from "lucide-react"
import { useBuilderStore } from "@/store/builder-store"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function ToolbarButton({
  label,
  shortcut,
  onClick,
  disabled,
  children,
}: {
  label: string
  shortcut?: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut !== undefined ? ` (${shortcut})` : ""}
      </TooltipContent>
    </Tooltip>
  )
}

export function BuilderToolbar() {
  const undo = useBuilderStore((state) => state.undo)
  const redo = useBuilderStore((state) => state.redo)
  const clearCanvas = useBuilderStore((state) => state.clearCanvas)
  const canUndo = useBuilderStore((state) => state.past.length > 0)
  const canRedo = useBuilderStore((state) => state.future.length > 0)
  const isEmpty = useBuilderStore((state) => state.nodes.length === 0)
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Regex className="size-4" aria-hidden="true" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight">Visual Regex Builder</h1>
      </div>

      <Separator orientation="vertical" className="mx-1 !h-5" />

      <div className="flex items-center gap-0.5">
        <ToolbarButton label="Undo" shortcut="Ctrl+Z" onClick={undo} disabled={!canUndo}>
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton label="Redo" shortcut="Ctrl+Shift+Z" onClick={redo} disabled={!canRedo}>
          <Redo2 />
        </ToolbarButton>
        <ToolbarButton label="Clear canvas" onClick={clearCanvas} disabled={isEmpty}>
          <Trash2 />
        </ToolbarButton>
      </div>

      <div className="ml-auto">
        <ToolbarButton
          label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
        </ToolbarButton>
      </div>
    </header>
  )
}
