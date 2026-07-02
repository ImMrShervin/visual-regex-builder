import type { Edge, Node } from "@xyflow/react"
import type { AstNode, QuantifierKind } from "@/lib/regex/ast"
import { sequence } from "@/lib/regex/ast"
import type { BlockSettings, BlockType } from "@/lib/blocks/definitions"
import { getBlockDefinition } from "@/lib/blocks/definitions"

export type BlockNodeData = {
  blockType: BlockType
  settings: BlockSettings
}

export type BlockNode = Node<BlockNodeData, "block">

export const HANDLE_IN = "in"
export const HANDLE_OUT = "out"
export const HANDLE_CONTENT = "content"
export const branchHandle = (index: number): string => `branch-${index}`

export interface CompileResult {
  ast: AstNode
  warnings: string[]
}

const QUANTIFIER_KINDS: Record<string, QuantifierKind> = {
  optional: "optional",
  zeroOrMore: "zeroOrMore",
  oneOrMore: "oneOrMore",
  repeat: "repeat",
}

interface GraphIndex {
  nodeById: Map<string, BlockNode>
  nextOf: Map<string, string>
  contentOf: Map<string, string>
  branchesOf: Map<string, Map<number, string>>
  hasIncoming: Set<string>
}

function buildIndex(nodes: BlockNode[], edges: Edge[]): GraphIndex {
  const nodeById = new Map<string, BlockNode>(nodes.map((node) => [node.id, node]))
  const nextOf = new Map<string, string>()
  const contentOf = new Map<string, string>()
  const branchesOf = new Map<string, Map<number, string>>()
  const hasIncoming = new Set<string>()

  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) continue
    const sourceHandle = edge.sourceHandle ?? HANDLE_OUT
    hasIncoming.add(edge.target)

    if (sourceHandle === HANDLE_OUT) {
      nextOf.set(edge.source, edge.target)
    } else if (sourceHandle === HANDLE_CONTENT) {
      contentOf.set(edge.source, edge.target)
    } else if (sourceHandle.startsWith("branch-")) {
      const index = Number.parseInt(sourceHandle.slice("branch-".length), 10)
      if (!Number.isNaN(index)) {
        const branches = branchesOf.get(edge.source) ?? new Map<number, string>()
        branches.set(index, edge.target)
        branchesOf.set(edge.source, branches)
      }
    }
  }

  return { nodeById, nextOf, contentOf, branchesOf, hasIncoming }
}

function nodeToAst(
  node: BlockNode,
  index: GraphIndex,
  visited: Set<string>,
  warnings: string[],
): AstNode | null {
  const { blockType, settings } = node.data
  switch (blockType) {
    case "start":
      return { type: "start" }
    case "end":
      return { type: "end" }
    case "text":
      return { type: "text", value: settings.text }
    case "digit":
      return { type: "digit" }
    case "letter":
      return { type: "letter" }
    case "uppercase":
      return { type: "uppercase" }
    case "lowercase":
      return { type: "lowercase" }
    case "whitespace":
      return { type: "whitespace" }
    case "nonWhitespace":
      return { type: "nonWhitespace" }
    case "word":
      return { type: "word" }
    case "nonWord":
      return { type: "nonWord" }
    case "any":
      return { type: "any" }
    case "number":
      return { type: "number" }
    case "charSet":
    case "negatedSet":
      return {
        type: "charSet",
        negated: settings.negated,
        uppercase: settings.uppercase,
        lowercase: settings.lowercase,
        digits: settings.digits,
        underscore: settings.underscore,
        space: settings.space,
        custom: settings.custom,
      }
    case "group":
    case "namedGroup":
    case "nonCapturingGroup": {
      const child = contentToAst(node.id, index, visited, warnings)
      const kind =
        blockType === "group" ? "capturing" : blockType === "namedGroup" ? "named" : "nonCapturing"
      return {
        type: "group",
        kind,
        name: blockType === "namedGroup" ? settings.name : null,
        child,
      }
    }
    case "lookahead":
    case "negativeLookahead":
    case "lookbehind":
    case "negativeLookbehind": {
      const child = contentToAst(node.id, index, visited, warnings)
      return { type: "lookaround", kind: blockType, child }
    }
    case "either": {
      const branchMap = index.branchesOf.get(node.id)
      const branches: AstNode[] = []
      if (branchMap !== undefined) {
        const sorted = [...branchMap.entries()].sort((a, b) => a[0] - b[0])
        for (const [, startId] of sorted) {
          branches.push(chainToAst(startId, index, visited, warnings))
        }
      }
      if (branches.length === 0) {
        warnings.push("Either block has no connected branches")
        return null
      }
      return { type: "alternation", branches }
    }
    case "boundary":
      return { type: "boundary" }
    case "nonBoundary":
      return { type: "nonBoundary" }
    case "tab":
      return { type: "tab" }
    case "newline":
      return { type: "newline" }
    case "carriageReturn":
      return { type: "carriageReturn" }
    case "escape":
      return { type: "escaped", value: settings.value }
    case "literal":
      return { type: "literal", value: settings.value }
    case "custom":
      return { type: "custom", pattern: settings.pattern }
    case "comment":
      return { type: "comment", text: settings.comment }
    default:
      return null
  }
}

function contentToAst(
  nodeId: string,
  index: GraphIndex,
  visited: Set<string>,
  warnings: string[],
): AstNode {
  const startId = index.contentOf.get(nodeId)
  if (startId === undefined) {
    const node = index.nodeById.get(nodeId)
    const label = node !== undefined ? getBlockDefinition(node.data.blockType).label : "Container"
    warnings.push(`${label} block is empty — connect blocks to its content handle`)
    return { type: "sequence", children: [] }
  }
  return chainToAst(startId, index, visited, warnings)
}

function chainToAst(
  startId: string,
  index: GraphIndex,
  visited: Set<string>,
  warnings: string[],
): AstNode {
  const children: AstNode[] = []
  let currentId: string | undefined = startId

  while (currentId !== undefined) {
    if (visited.has(currentId)) {
      warnings.push("Cycle detected in block connections — chain truncated")
      break
    }
    visited.add(currentId)

    const node = index.nodeById.get(currentId)
    if (node === undefined) break

    const quantifierKind = QUANTIFIER_KINDS[node.data.blockType]
    if (quantifierKind !== undefined) {
      const previous = children.pop()
      if (previous === undefined || previous.type === "comment") {
        if (previous !== undefined) children.push(previous)
        warnings.push(
          `${getBlockDefinition(node.data.blockType).label} block needs a block before it to repeat`,
        )
      } else {
        const { settings } = node.data
        const bounds = quantifierBounds(quantifierKind, settings.min, settings.max)
        children.push({
          type: "quantifier",
          kind: quantifierKind,
          min: bounds.min,
          max: bounds.max,
          lazy: settings.lazy,
          child: previous,
        })
      }
    } else {
      const ast = nodeToAst(node, index, visited, warnings)
      if (ast !== null) children.push(ast)
    }

    currentId = index.nextOf.get(currentId)
  }

  return sequence(children)
}

function quantifierBounds(
  kind: QuantifierKind,
  min: number,
  max: number | null,
): { min: number; max: number | null } {
  switch (kind) {
    case "optional":
      return { min: 0, max: 1 }
    case "zeroOrMore":
      return { min: 0, max: null }
    case "oneOrMore":
      return { min: 1, max: null }
    case "repeat":
      return { min, max }
  }
}

export function graphToAst(nodes: BlockNode[], edges: Edge[]): CompileResult {
  const warnings: string[] = []
  const index = buildIndex(nodes, edges)

  const roots = nodes
    .filter((node) => !index.hasIncoming.has(node.id))
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)

  const visited = new Set<string>()
  const children: AstNode[] = []
  for (const root of roots) {
    if (visited.has(root.id)) continue
    const ast = chainToAst(root.id, index, visited, warnings)
    if (ast.type !== "sequence" || ast.children.length > 0) {
      children.push(ast)
    }
  }

  return { ast: sequence(children), warnings }
}
