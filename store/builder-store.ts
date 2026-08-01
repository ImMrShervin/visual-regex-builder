"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react"
import type { BlockSettings, BlockType } from "@/lib/blocks/definitions"
import { createBlockSettings } from "@/lib/blocks/definitions"
import type { BlockNode } from "@/lib/flow/graph-to-ast"
import { HANDLE_IN, HANDLE_OUT } from "@/lib/flow/graph-to-ast"

interface Snapshot {
  nodes: BlockNode[]
  edges: Edge[]
}

const MAX_HISTORY = 100

let idCounter = 0
function createId(): string {
  idCounter += 1
  return `block-${Date.now().toString(36)}-${idCounter}`
}

function cloneSnapshot(nodes: BlockNode[], edges: Edge[]): Snapshot {
  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: { blockType: node.data.blockType, settings: { ...node.data.settings } },
    })),
    edges: edges.map((edge) => ({ ...edge })),
  }
}

export interface BuilderState {
  nodes: BlockNode[]
  edges: Edge[]
  past: Snapshot[]
  future: Snapshot[]
  clipboard: Snapshot | null
  testInput: string

  onNodesChange: (changes: NodeChange<BlockNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  commit: () => void
  undo: () => void
  redo: () => void

  addBlock: (
    type: BlockType,
    position: { x: number; y: number },
    options?: { connectFrom?: string },
  ) => void
  updateSettings: (nodeId: string, partial: Partial<BlockSettings>) => void
  deleteSelection: () => void
  copySelection: () => void
  paste: () => void
  duplicateSelection: () => void
  selectAll: () => void
  clearCanvas: () => void
  importGraph: (nodes: BlockNode[], edges: Edge[]) => void
  setTestInput: (value: string) => void
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      past: [],
      future: [],
      clipboard: null,
      testInput: "hello123",

      onNodesChange: (changes) => {
        set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }))
      },

      onEdgesChange: (changes) => {
        set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }))
      },

      onConnect: (connection) => {
        if (connection.source === null || connection.target === null) return
        if (connection.source === connection.target) return
        get().commit()
        set((state) => {
          const sourceHandle = connection.sourceHandle ?? HANDLE_OUT
          const targetHandle = connection.targetHandle ?? HANDLE_IN
          const edges = state.edges.filter(
            (edge) =>
              !(
                edge.source === connection.source &&
                (edge.sourceHandle ?? HANDLE_OUT) === sourceHandle
              ) && edge.target !== connection.target,
          )
          edges.push({
            id: `edge-${createId()}`,
            source: connection.source,
            sourceHandle,
            target: connection.target,
            targetHandle,
          })
          return { edges }
        })
      },

      commit: () => {
        set((state) => ({
          past: [...state.past.slice(-MAX_HISTORY + 1), cloneSnapshot(state.nodes, state.edges)],
          future: [],
        }))
      },

      undo: () => {
        set((state) => {
          const previous = state.past[state.past.length - 1]
          if (previous === undefined) return state
          return {
            nodes: previous.nodes,
            edges: previous.edges,
            past: state.past.slice(0, -1),
            future: [cloneSnapshot(state.nodes, state.edges), ...state.future],
          }
        })
      },

      redo: () => {
        set((state) => {
          const next = state.future[0]
          if (next === undefined) return state
          return {
            nodes: next.nodes,
            edges: next.edges,
            past: [...state.past, cloneSnapshot(state.nodes, state.edges)],
            future: state.future.slice(1),
          }
        })
      },

      addBlock: (type, position, options) => {
        get().commit()
        const node: BlockNode = {
          id: createId(),
          type: "block",
          position,
          selected: true,
          data: { blockType: type, settings: createBlockSettings(type) },
        }
        set((state) => {
          const edges = [...state.edges]
          const connectFrom = options?.connectFrom
          if (connectFrom !== undefined) {
            const outTaken = edges.some(
              (edge) =>
                edge.source === connectFrom && (edge.sourceHandle ?? HANDLE_OUT) === HANDLE_OUT,
            )
            if (!outTaken) {
              edges.push({
                id: `edge-${createId()}`,
                source: connectFrom,
                sourceHandle: HANDLE_OUT,
                target: node.id,
                targetHandle: HANDLE_IN,
              })
            }
          }
          return {
            nodes: [...state.nodes.map((n) => ({ ...n, selected: false })), node],
            edges,
          }
        })
      },

      updateSettings: (nodeId, partial) => {
        get().commit()
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, settings: { ...node.data.settings, ...partial } } }
              : node,
          ),
        }))
      },

      deleteSelection: () => {
        const { nodes, edges } = get()
        const selectedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id))
        const selectedEdgeIds = new Set(edges.filter((e) => e.selected).map((e) => e.id))
        if (selectedIds.size === 0 && selectedEdgeIds.size === 0) return
        get().commit()
        set((state) => ({
          nodes: state.nodes.filter((node) => !selectedIds.has(node.id)),
          edges: state.edges.filter(
            (edge) =>
              !selectedEdgeIds.has(edge.id) &&
              !selectedIds.has(edge.source) &&
              !selectedIds.has(edge.target),
          ),
        }))
      },

      copySelection: () => {
        const { nodes, edges } = get()
        const selected = nodes.filter((node) => node.selected)
        if (selected.length === 0) return
        const selectedIds = new Set(selected.map((node) => node.id))
        const innerEdges = edges.filter(
          (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
        )
        set({ clipboard: cloneSnapshot(selected, innerEdges) })
      },

      paste: () => {
        const { clipboard } = get()
        if (clipboard === null || clipboard.nodes.length === 0) return
        get().commit()
        const idMap = new Map<string, string>()
        const pastedNodes: BlockNode[] = clipboard.nodes.map((node) => {
          const newId = createId()
          idMap.set(node.id, newId)
          return {
            ...node,
            id: newId,
            selected: true,
            position: { x: node.position.x + 40, y: node.position.y + 40 },
            data: { blockType: node.data.blockType, settings: { ...node.data.settings } },
          }
        })
        const pastedEdges: Edge[] = clipboard.edges.map((edge) => ({
          ...edge,
          id: `edge-${createId()}`,
          source: idMap.get(edge.source) ?? edge.source,
          target: idMap.get(edge.target) ?? edge.target,
          selected: false,
        }))
        set((state) => ({
          nodes: [...state.nodes.map((n) => ({ ...n, selected: false })), ...pastedNodes],
          edges: [...state.edges.map((e) => ({ ...e, selected: false })), ...pastedEdges],
        }))
      },

      duplicateSelection: () => {
        get().copySelection()
        get().paste()
      },

      selectAll: () => {
        set((state) => ({
          nodes: state.nodes.map((node) => ({ ...node, selected: true })),
          edges: state.edges.map((edge) => ({ ...edge, selected: true })),
        }))
      },

      clearCanvas: () => {
        get().commit()
        set({ nodes: [], edges: [] })
      },

      importGraph: (nodes, edges) => {
        get().commit()
        set({ nodes, edges })
      },

      setTestInput: (value) => {
        set({ testInput: value })
      },
    }),
    {
      name: "visual-regex-builder",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        testInput: state.testInput,
      }),
    },
  ),
)
