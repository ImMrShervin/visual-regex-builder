"use client"

import { useMemo } from "react"
import { useBuilderStore } from "@/store/builder-store"
import { graphToAst } from "@/lib/flow/graph-to-ast"
import { generateRegex, validatePattern } from "@/lib/regex/generator"
import { explainAst, type ExplanationEntry } from "@/lib/regex/explainer"
import type { AstNode } from "@/lib/regex/ast"

export interface CompiledRegex {
  ast: AstNode
  pattern: string
  warnings: string[]
  error: string | null
  explanation: ExplanationEntry[]
}

export function useCompiledRegex(): CompiledRegex {
  const nodes = useBuilderStore((state) => state.nodes)
  const edges = useBuilderStore((state) => state.edges)

  return useMemo(() => {
    const { ast, warnings } = graphToAst(nodes, edges)
    const pattern = generateRegex(ast)
    const { valid, error } = validatePattern(pattern)
    return {
      ast,
      pattern,
      warnings,
      error: valid ? null : error,
      explanation: explainAst(ast),
    }
  }, [nodes, edges])
}
