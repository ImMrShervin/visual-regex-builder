import type { AstNode, CharSetNode, QuantifierNode } from "./ast"

export function escapeText(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
}

export function escapeCharClass(value: string): string {
  let out = ""
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if (char === "-") {
      const prev = value[i - 1]
      const next = value[i + 1]
      const isRange =
        prev !== undefined &&
        next !== undefined &&
        /[A-Za-z0-9]/.test(prev) &&
        /[A-Za-z0-9]/.test(next) &&
        prev.charCodeAt(0) < next.charCodeAt(0)
      out += isRange ? "-" : "\\-"
    } else if (char === "^" || char === "]" || char === "\\") {
      out += `\\${char}`
    } else {
      out += char
    }
  }
  return out
}

function charSetToRegex(node: CharSetNode): string {
  let body = ""
  if (node.uppercase) body += "A-Z"
  if (node.lowercase) body += "a-z"
  if (node.digits) body += "0-9"
  if (node.underscore) body += "_"
  if (node.space) body += " "
  if (node.custom.length > 0) body += escapeCharClass(node.custom)
  if (body.length === 0) return ""
  return `[${node.negated ? "^" : ""}${body}]`
}

function isAtom(node: AstNode): boolean {
  switch (node.type) {
    case "digit":
    case "nonDigit":
    case "letter":
    case "uppercase":
    case "lowercase":
    case "whitespace":
    case "nonWhitespace":
    case "word":
    case "nonWord":
    case "any":
    case "charSet":
    case "group":
    case "tab":
    case "newline":
    case "carriageReturn":
      return true
    case "text":
      return node.value.length === 1 && escapeText(node.value).length <= 2
    case "literal":
      return node.value.length === 1
    case "escaped":
      return node.value.length === 1
    default:
      return false
  }
}

function quantifierSuffix(node: QuantifierNode): string {
  let suffix: string
  switch (node.kind) {
    case "optional":
      suffix = "?"
      break
    case "zeroOrMore":
      suffix = "*"
      break
    case "oneOrMore":
      suffix = "+"
      break
    case "repeat": {
      const min = Math.max(0, node.min)
      if (node.max === null) {
        suffix = `{${min},}`
      } else if (node.max === min) {
        suffix = `{${min}}`
      } else {
        suffix = `{${min},${Math.max(min, node.max)}}`
      }
      break
    }
  }
  return node.lazy ? `${suffix}?` : suffix
}

export function generateRegex(node: AstNode): string {
  switch (node.type) {
    case "sequence":
      return node.children.map(generateRegex).join("")
    case "start":
      return "^"
    case "end":
      return "$"
    case "text":
      return escapeText(node.value)
    case "digit":
      return "\\d"
    case "nonDigit":
      return "\\D"
    case "letter":
      return "[a-zA-Z]"
    case "uppercase":
      return "[A-Z]"
    case "lowercase":
      return "[a-z]"
    case "whitespace":
      return "\\s"
    case "nonWhitespace":
      return "\\S"
    case "word":
      return "\\w"
    case "nonWord":
      return "\\W"
    case "any":
      return "."
    case "number":
      return "\\d+"
    case "charSet":
      return charSetToRegex(node)
    case "quantifier": {
      const child = generateRegex(node.child)
      if (child.length === 0) return ""
      const wrapped = isAtom(node.child) ? child : `(?:${child})`
      return `${wrapped}${quantifierSuffix(node)}`
    }
    case "group": {
      const child = generateRegex(node.child)
      switch (node.kind) {
        case "capturing":
          return `(${child})`
        case "named":
          return `(?<${node.name && node.name.length > 0 ? node.name : "group"}>${child})`
        case "nonCapturing":
          return `(?:${child})`
      }
      break
    }
    case "lookaround": {
      const child = generateRegex(node.child)
      switch (node.kind) {
        case "lookahead":
          return `(?=${child})`
        case "negativeLookahead":
          return `(?!${child})`
        case "lookbehind":
          return `(?<=${child})`
        case "negativeLookbehind":
          return `(?<!${child})`
      }
      break
    }
    case "alternation": {
      const branches = node.branches
        .map(generateRegex)
        .filter((branch) => branch.length > 0)
      if (branches.length === 0) return ""
      if (branches.length === 1) return branches[0]
      return branches.join("|")
    }
    case "boundary":
      return "\\b"
    case "nonBoundary":
      return "\\B"
    case "tab":
      return "\\t"
    case "newline":
      return "\\n"
    case "carriageReturn":
      return "\\r"
    case "escaped":
      return node.value.length > 0 ? `\\${node.value[0]}` : ""
    case "literal":
      return node.value.length > 0 ? escapeText(node.value[0]) : ""
    case "custom":
      return node.pattern
    case "comment":
      return ""
  }
  return ""
}

export function validatePattern(pattern: string): { valid: boolean; error: string | null } {
  try {
    new RegExp(pattern)
    return { valid: true, error: null }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid pattern",
    }
  }
}
