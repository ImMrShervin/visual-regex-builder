"use client"

import { useEffect, useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { useCompiledRegex } from "@/hooks/use-compiled-regex"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { BuilderToolbar } from "./toolbar"
import { BuilderSidebar } from "./sidebar"
import { BuilderCanvas } from "./canvas"
import { PropertiesPanel } from "./properties-panel"
import { RegexBar } from "./regex-bar"
import { TesterPanel } from "./tester-panel"

function Builder() {
  const compiled = useCompiledRegex()
  useKeyboardShortcuts()

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <BuilderToolbar />
      <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="65%" minSize="35%">
          <ResizablePanelGroup orientation="horizontal" className="h-full">
            <ResizablePanel defaultSize="17%" minSize="12%" maxSize="28%">
              <BuilderSidebar />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="60%" minSize="30%">
              <BuilderCanvas />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="23%" minSize="15%" maxSize="35%">
              <PropertiesPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="35%" minSize="20%">
          <div className="flex h-full flex-col">
            <RegexBar compiled={compiled} />
            <div className="min-h-0 flex-1">
              <TesterPanel compiled={compiled} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export function AppShell() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading builder…</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <ReactFlowProvider>
        <Builder />
      </ReactFlowProvider>
    </TooltipProvider>
  )
}
