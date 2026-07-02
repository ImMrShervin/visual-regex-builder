"use client"

import { useCallback } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  SelectionMode,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { useBuilderStore } from "@/store/builder-store"
import type { BlockType } from "@/lib/blocks/definitions"
import { BLOCK_DEFINITIONS } from "@/lib/blocks/definitions"
import { BlockNodeView } from "./block-node"
import { DRAG_MIME } from "./sidebar"

const nodeTypes: NodeTypes = { block: BlockNodeView }

const VALID_TYPES = new Set<string>(BLOCK_DEFINITIONS.map((d) => d.type))

export function BuilderCanvas() {
  const nodes = useBuilderStore((state) => state.nodes)
  const edges = useBuilderStore((state) => state.edges)
  const onNodesChange = useBuilderStore((state) => state.onNodesChange)
  const onEdgesChange = useBuilderStore((state) => state.onEdgesChange)
  const onConnect = useBuilderStore((state) => state.onConnect)
  const addBlock = useBuilderStore((state) => state.addBlock)
  const commit = useBuilderStore((state) => state.commit)

  const { screenToFlowPosition } = useReactFlow()

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes(DRAG_MIME)) {
      event.preventDefault()
      event.dataTransfer.dropEffect = "move"
    }
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const type = event.dataTransfer.getData(DRAG_MIME)
      if (!VALID_TYPES.has(type)) return
      event.preventDefault()
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addBlock(type as BlockType, position)
    },
    [screenToFlowPosition, addBlock],
  )

  return (
    <div className="h-full w-full" aria-label="Regex canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={() => commit()}
        onDragOver={onDragOver}
        onDrop={onDrop}
        deleteKeyCode={null}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        snapToGrid
        snapGrid={[10, 10]}
        fitView
        fitViewOptions={{ maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-muted/30"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable className="!bg-background" />
      </ReactFlow>
    </div>
  )
}
