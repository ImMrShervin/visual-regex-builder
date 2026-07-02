import type { AstNode } from "./ast"
import { generateRegex } from "./generator"

export interface ExplanationEntry {
  token: string
  description: string
  depth: number
}

function describe(node: AstNode): string {
  switch (node.type) {
    case "sequence":
      return "Sequence of patterns"
    case "start":
      return "Start of the string"
    case "end":
      return "End of the string"
    case "text":
      return `Matches the text "${node.value}" literally`
    case "digit":
      return "Any digit (0-9)"
    case "nonDigit":
      return "Any character that is not a digit"
    case "letter":
      return "Any letter (a-z, A-Z)"
    case "uppercase":
      return "Any uppercase letter (A-Z)"
    case "lowercase":
      return "Any lowercase letter (a-z)"
    case "whitespace":
      return "Any whitespace character (space, tab, newline)"
    case "nonWhitespace":
      return "Any character that is not whitespace"
    case "word":
      return "Any word character (letter, digit, or underscore)"
    case "nonWord":
      return "Any character that is not a word character"
    case "any":
      return "Any single character (except newline)"
    case "number":
      return "One or more digits (a whole number)"
    case "charSet": {
      const parts: string[] = []
      if (node.uppercase) parts.push("uppercase letters")
      if (node.lowercase) parts.push("lowercase letters")
      if (node.digits) parts.push("digits")
      if (node.underscore) parts.push("underscore")
      if (node.space) parts.push("space")
      if (node.custom.length > 0) parts.push(`the characters "${node.custom}"`)
      const list = parts.length > 0 ? parts.join(", ") : "nothing"
      return node.negated
        ? `Any character NOT in the set: ${list}`
        : `Any character in the set: ${list}`
    }
    case "quantifier": {
      const lazy = node.lazy ? " (lazy — matches as few as possible)" : ""
      switch (node.kind) {
        case "optional":
          return `Optional — the previous element zero or one time${lazy}`
        case "zeroOrMore":
          return `The previous element zero or more times${lazy}`
        case "oneOrMore":
          return `The previous element one or more times${lazy}`
        case "repeat": {
          if (node.max === null) return `The previous element ${node.min} or more times${lazy}`
          if (node.max === node.min) {
            return `The previous element exactly ${node.min} time${node.min === 1 ? "" : "s"}${lazy}`
          }
          return `The previous element between ${node.min} and ${node.max} times${lazy}`
        }
      }
      break
    }
    case "group":
      switch (node.kind) {
        case "capturing":
          return "Capturing group — remembers the matched text"
        case "named":
          return `Named capturing group "${node.name ?? "group"}"`
        case "nonCapturing":
          return "Non-capturing group — groups without remembering"
      }
      break
    case "lookaround":
      switch (node.kind) {
        case "lookahead":
          return "Lookahead — the following pattern must come next (not consumed)"
        case "negativeLookahead":
          return "Negative lookahead — the following pattern must NOT come next"
        case "lookbehind":
          return "Lookbehind — the pattern must come immediately before"
        case "negativeLookbehind":
          return "Negative lookbehind — the pattern must NOT come immediately before"
      }
      break
    case "alternation":
      return "Alternation — matches either of the alternatives"
    case "boundary":
      return "Word boundary — position between a word and non-word character"
    case "nonBoundary":
      return "Non word boundary"
    case "tab":
      return "Tab character"
    case "newline":
      return "Newline character"
    case "carriageReturn":
      return "Carriage return character"
    case "escaped":
      return `Escaped character "\\${node.value}"`
    case "literal":
      return `The literal character "${node.value}"`
    case "custom":
      return "Custom raw regex fragment"
    case "comment":
      return `Comment: ${node.text} (produces no output)`
  }
  return "Pattern element"
}

function walk(node: AstNode, depth: number, entries: ExplanationEntry[]): void {
  if (node.type === "sequence") {
    for (const child of node.children) {
      walk(child, depth, entries)
    }
    return
  }

  const token = node.type === "comment" ? `# ${node.text}` : generateRegex(node)
  if (token.length === 0 && node.type !== "comment") return

  entries.push({ token, description: describe(node), depth })

  if (node.type === "quantifier") {
    walk(node.child, depth + 1, entries)
  } else if (node.type === "group" || node.type === "lookaround") {
    walk(node.child, depth + 1, entries)
  } else if (node.type === "alternation") {
    node.branches.forEach((branch, index) => {
      entries.push({
        token: `— alternative ${index + 1}`,
        description: `Branch ${index + 1} of the alternation`,
        depth: depth + 1,
      })
      walk(branch, depth + 2, entries)
    })
  }
}

export function explainAst(node: AstNode): ExplanationEntry[] {
  const entries: ExplanationEntry[] = []
  walk(node, 0, entries)
  return entries
}
