import type { Edge } from "@xyflow/react"
import type { AstNode } from "@/lib/regex/ast"
import type { BlockSettings, BlockType } from "@/lib/blocks/definitions"
import { createBlockSettings } from "@/lib/blocks/definitions"
import type { BlockNode } from "./graph-to-ast"
import { HANDLE_CONTENT, HANDLE_IN, HANDLE_OUT, branchHandle } from "./graph-to-ast"

const NODE_WIDTH = 190
const NODE_HEIGHT = 88
const GAP_X = 60
const GAP_Y = 70

interface LayoutResult {
  firstId: string | null
  lastId: string | null
  width: number
  height: number
}

class GraphBuilder {
  readonly nodes: BlockNode[] = []
  readonly edges: Edge[] = []
  private counter = 0

  private nextId(): string {
    this.counter += 1
    return `imported-${Date.now().toString(36)}-${this.counter}`
  }

  addNode(
    blockType: BlockType,
    x: number,
    y: number,
    overrides: Partial<BlockSettings> = {},
  ): string {
    const id = this.nextId()
    this.nodes.push({
      id,
      type: "block",
      position: { x, y },
      data: { blockType, settings: { ...createBlockSettings(blockType), ...overrides } },
    })
    return id
  }

  addEdge(source: string, sourceHandle: string, target: string): void {
    this.edges.push({
      id: `e-${source}-${sourceHandle}-${target}`,
      source,
      sourceHandle,
      target,
      targetHandle: HANDLE_IN,
    })
  }

  layoutSequence(node: AstNode, x: number, y: number): LayoutResult {
    const children = node.type === "sequence" ? node.children : [node]
    let cursorX = x
    let maxHeight = 0
    let firstId: string | null = null
    let lastId: string | null = null

    for (const child of children) {
      const result = this.layoutNode(child, cursorX, y)
      if (result.firstId === null || result.lastId === null) continue
      if (lastId !== null) {
        this.addEdge(lastId, HANDLE_OUT, result.firstId)
      }
      if (firstId === null) firstId = result.firstId
      lastId = result.lastId
      cursorX += result.width + GAP_X
      maxHeight = Math.max(maxHeight, result.height)
    }

    return {
      firstId,
      lastId,
      width: Math.max(0, cursorX - x - GAP_X),
      height: maxHeight,
    }
  }

  private layoutNode(node: AstNode, x: number, y: number): LayoutResult {
    switch (node.type) {
      case "sequence":
        return this.layoutSequence(node, x, y)
      case "quantifier": {
        const child = this.layoutNode(node.child, x, y)
        const quantX = x + child.width + GAP_X
        const blockType: BlockType = node.kind
        const id = this.addNode(blockType, quantX, y, {
          min: node.min,
          max: node.max,
          lazy: node.lazy,
        })
        if (child.lastId !== null) {
          this.addEdge(child.lastId, HANDLE_OUT, id)
        }
        return {
          firstId: child.firstId ?? id,
          lastId: id,
          width: child.width + GAP_X + NODE_WIDTH,
          height: Math.max(child.height, NODE_HEIGHT),
        }
      }
      case "group": {
        const blockType: BlockType =
          node.kind === "capturing"
            ? "group"
            : node.kind === "named"
              ? "namedGroup"
              : "nonCapturingGroup"
        const id = this.addNode(blockType, x, y, { name: node.name ?? "name" })
        const content = this.layoutSequence(node.child, x + 40, y + NODE_HEIGHT + GAP_Y)
        if (content.firstId !== null) {
          this.addEdge(id, HANDLE_CONTENT, content.firstId)
        }
        return {
          firstId: id,
          lastId: id,
          width: Math.max(NODE_WIDTH, 40 + content.width),
          height: NODE_HEIGHT + (content.firstId !== null ? GAP_Y + content.height : 0),
        }
      }
      case "lookaround": {
        const id = this.addNode(node.kind, x, y)
        const content = this.layoutSequence(node.child, x + 40, y + NODE_HEIGHT + GAP_Y)
        if (content.firstId !== null) {
          this.addEdge(id, HANDLE_CONTENT, content.firstId)
        }
        return {
          firstId: id,
          lastId: id,
          width: Math.max(NODE_WIDTH, 40 + content.width),
          height: NODE_HEIGHT + (content.firstId !== null ? GAP_Y + content.height : 0),
        }
      }
      case "alternation": {
        const id = this.addNode("either", x, y, { branches: node.branches.length })
        let branchY = y + NODE_HEIGHT + GAP_Y
        let maxWidth = NODE_WIDTH
        node.branches.forEach((branch, i) => {
          const content = this.layoutSequence(branch, x + 40, branchY)
          if (content.firstId !== null) {
            this.addEdge(id, branchHandle(i), content.firstId)
            branchY += Math.max(content.height, NODE_HEIGHT) + GAP_Y
            maxWidth = Math.max(maxWidth, 40 + content.width)
          }
        })
        return {
          firstId: id,
          lastId: id,
          width: maxWidth,
          height: branchY - y - GAP_Y,
        }
      }
      case "charSet": {
        const blockType: BlockType = node.negated ? "negatedSet" : "charSet"
        const id = this.addNode(blockType, x, y, {
          negated: node.negated,
          uppercase: node.uppercase,
          lowercase: node.lowercase,
          digits: node.digits,
          underscore: node.underscore,
          space: node.space,
          custom: node.custom,
        })
        return { firstId: id, lastId: id, width: NODE_WIDTH, height: NODE_HEIGHT }
      }
      default: {
        const mapped = this.leafToBlock(node)
        if (mapped === null) return { firstId: null, lastId: null, width: 0, height: 0 }
        const id = this.addNode(mapped.blockType, x, y, mapped.overrides)
        return { firstId: id, lastId: id, width: NODE_WIDTH, height: NODE_HEIGHT }
      }
    }
  }

  private leafToBlock(
    node: AstNode,
  ): { blockType: BlockType; overrides: Partial<BlockSettings> } | null {
    switch (node.type) {
      case "start":
        return { blockType: "start", overrides: {} }
      case "end":
        return { blockType: "end", overrides: {} }
      case "text":
        return { blockType: "text", overrides: { text: node.value } }
      case "digit":
        return { blockType: "digit", overrides: {} }
      case "nonDigit":
        return {
          blockType: "negatedSet",
          overrides: { negated: true, digits: true, uppercase: false, lowercase: false },
        }
      case "letter":
        return { blockType: "letter", overrides: {} }
      case "uppercase":
        return { blockType: "uppercase", overrides: {} }
      case "lowercase":
        return { blockType: "lowercase", overrides: {} }
      case "whitespace":
        return { blockType: "whitespace", overrides: {} }
      case "nonWhitespace":
        return { blockType: "nonWhitespace", overrides: {} }
      case "word":
        return { blockType: "word", overrides: {} }
      case "nonWord":
        return { blockType: "nonWord", overrides: {} }
      case "any":
        return { blockType: "any", overrides: {} }
      case "number":
        return { blockType: "number", overrides: {} }
      case "boundary":
        return { blockType: "boundary", overrides: {} }
      case "nonBoundary":
        return { blockType: "nonBoundary", overrides: {} }
      case "tab":
        return { blockType: "tab", overrides: {} }
      case "newline":
        return { blockType: "newline", overrides: {} }
      case "carriageReturn":
        return { blockType: "carriageReturn", overrides: {} }
      case "escaped":
        return { blockType: "escape", overrides: { value: node.value } }
      case "literal":
        return { blockType: "literal", overrides: { value: node.value } }
      case "custom":
        return { blockType: "custom", overrides: { pattern: node.pattern } }
      case "comment":
        return { blockType: "comment", overrides: { comment: node.text } }
      default:
        return null
    }
  }
}

export function astToGraph(ast: AstNode): { nodes: BlockNode[]; edges: Edge[] } {
  const builder = new GraphBuilder()
  builder.layoutSequence(ast, 60, 60)
  return { nodes: builder.nodes, edges: builder.edges }
}
