import type { AstNode, CharSetNode, QuantifierKind } from "./ast"
import { sequence } from "./ast"

export class RegexParseError extends Error {
  readonly position: number

  constructor(message: string, position: number) {
    super(`${message} (at position ${position})`)
    this.name = "RegexParseError"
    this.position = position
  }
}

const SHORTHAND_ESCAPES: Record<string, AstNode> = {
  d: { type: "digit" },
  D: { type: "nonDigit" },
  w: { type: "word" },
  W: { type: "nonWord" },
  s: { type: "whitespace" },
  S: { type: "nonWhitespace" },
  b: { type: "boundary" },
  B: { type: "nonBoundary" },
  t: { type: "tab" },
  n: { type: "newline" },
  r: { type: "carriageReturn" },
}

class Parser {
  private readonly input: string
  private pos = 0

  constructor(input: string) {
    this.input = input
  }

  parse(): AstNode {
    if (this.input.length === 0) {
      return { type: "sequence", children: [] }
    }
    const node = this.parseAlternation()
    if (this.pos < this.input.length) {
      throw new RegexParseError(`Unexpected character "${this.peek()}"`, this.pos)
    }
    return node
  }

  private peek(): string {
    return this.input[this.pos] ?? ""
  }

  private next(): string {
    const char = this.input[this.pos] ?? ""
    this.pos += 1
    return char
  }

  private eof(): boolean {
    return this.pos >= this.input.length
  }

  private parseAlternation(): AstNode {
    const branches: AstNode[] = [this.parseSequence()]
    while (this.peek() === "|") {
      this.next()
      branches.push(this.parseSequence())
    }
    if (branches.length === 1) return branches[0]
    return { type: "alternation", branches }
  }

  private parseSequence(): AstNode {
    const children: AstNode[] = []
    let textBuffer = ""

    const flushText = (): void => {
      if (textBuffer.length > 0) {
        children.push({ type: "text", value: textBuffer })
        textBuffer = ""
      }
    }

    while (!this.eof() && this.peek() !== "|" && this.peek() !== ")") {
      const atomStart = this.pos
      const atom = this.parseAtom()
      const quantified = this.tryParseQuantifier(atom, atomStart)

      if (quantified !== null) {
        flushText()
        children.push(quantified)
      } else if (atom.type === "text") {
        textBuffer += atom.value
      } else {
        flushText()
        children.push(atom)
      }
    }

    flushText()
    return sequence(children)
  }

  private tryParseQuantifier(child: AstNode, atomStart: number): AstNode | null {
    const char = this.peek()
    let kind: QuantifierKind | null = null
    let min = 0
    let max: number | null = null

    if (char === "?") {
      kind = "optional"
      min = 0
      max = 1
      this.next()
    } else if (char === "*") {
      kind = "zeroOrMore"
      min = 0
      max = null
      this.next()
    } else if (char === "+") {
      kind = "oneOrMore"
      min = 1
      max = null
      this.next()
    } else if (char === "{") {
      const bounds = this.tryParseRepeatBounds()
      if (bounds === null) return null
      kind = "repeat"
      min = bounds.min
      max = bounds.max
    }

    if (kind === null) return null

    if (child.type === "start" || child.type === "end" || child.type === "boundary") {
      throw new RegexParseError("Cannot quantify an anchor", atomStart)
    }

    let target = child
    let prefix: AstNode | null = null
    if (child.type === "text" && child.value.length > 1) {
      prefix = { type: "text", value: child.value.slice(0, -1) }
      target = { type: "text", value: child.value.slice(-1) }
    }

    let lazy = false
    if (this.peek() === "?") {
      lazy = true
      this.next()
    }

    const quantifier: AstNode = { type: "quantifier", kind, min, max, lazy, child: target }
    if (prefix !== null) {
      return { type: "sequence", children: [prefix, quantifier] }
    }
    return quantifier
  }

  private tryParseRepeatBounds(): { min: number; max: number | null } | null {
    const start = this.pos
    const match = /^\{(\d+)(?:(,)(\d*))?\}/.exec(this.input.slice(this.pos))
    if (match === null) {
      return null
    }
    this.pos = start + match[0].length
    const min = Number.parseInt(match[1], 10)
    if (match[2] === undefined) return { min, max: min }
    if (match[3] === undefined || match[3] === "") return { min, max: null }
    return { min, max: Number.parseInt(match[3], 10) }
  }

  private parseAtom(): AstNode {
    const char = this.peek()
    switch (char) {
      case "^":
        this.next()
        return { type: "start" }
      case "$":
        this.next()
        return { type: "end" }
      case ".":
        this.next()
        return { type: "any" }
      case "\\":
        return this.parseEscape()
      case "[":
        return this.parseCharClass()
      case "(":
        return this.parseGroup()
      case "*":
      case "+":
      case "?":
        throw new RegexParseError(`Unexpected quantifier "${char}"`, this.pos)
      default:
        this.next()
        return { type: "text", value: char }
    }
  }

  private parseEscape(): AstNode {
    const start = this.pos
    this.next()
    if (this.eof()) {
      throw new RegexParseError("Dangling escape at end of pattern", start)
    }
    const char = this.next()
    const shorthand = SHORTHAND_ESCAPES[char]
    if (shorthand !== undefined) {
      return { ...shorthand }
    }
    if (/[a-zA-Z0-9]/.test(char) && !"dDwWsSbBtnrfvk0".includes(char)) {
      throw new RegexParseError(`Unsupported escape "\\${char}"`, start)
    }
    if (/[.*+?^${}()|[\]\\/-]/.test(char)) {
      return { type: "text", value: char }
    }
    return { type: "escaped", value: char }
  }

  private parseGroup(): AstNode {
    const start = this.pos
    this.next()

    let node: AstNode
    if (this.peek() === "?") {
      this.next()
      const marker = this.peek()
      if (marker === ":") {
        this.next()
        node = { type: "group", kind: "nonCapturing", name: null, child: this.parseAlternation() }
      } else if (marker === "=") {
        this.next()
        node = { type: "lookaround", kind: "lookahead", child: this.parseAlternation() }
      } else if (marker === "!") {
        this.next()
        node = { type: "lookaround", kind: "negativeLookahead", child: this.parseAlternation() }
      } else if (marker === "<") {
        this.next()
        const after = this.peek()
        if (after === "=") {
          this.next()
          node = { type: "lookaround", kind: "lookbehind", child: this.parseAlternation() }
        } else if (after === "!") {
          this.next()
          node = { type: "lookaround", kind: "negativeLookbehind", child: this.parseAlternation() }
        } else {
          const name = this.parseGroupName()
          node = { type: "group", kind: "named", name, child: this.parseAlternation() }
        }
      } else if (marker === "#") {
        this.next()
        let text = ""
        while (!this.eof() && this.peek() !== ")") {
          text += this.next()
        }
        node = { type: "comment", text }
      } else {
        throw new RegexParseError(`Unsupported group syntax "(?${marker}"`, start)
      }
    } else {
      node = { type: "group", kind: "capturing", name: null, child: this.parseAlternation() }
    }

    if (this.peek() !== ")") {
      throw new RegexParseError("Unterminated group, expected )", start)
    }
    this.next()
    return node
  }

  private parseGroupName(): string {
    const start = this.pos
    let name = ""
    while (!this.eof() && this.peek() !== ">") {
      name += this.next()
    }
    if (this.eof()) {
      throw new RegexParseError("Unterminated group name, expected >", start)
    }
    this.next()
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
      throw new RegexParseError(`Invalid group name "${name}"`, start)
    }
    return name
  }

  private parseCharClass(): AstNode {
    const start = this.pos
    this.next()

    let negated = false
    if (this.peek() === "^") {
      negated = true
      this.next()
    }

    let raw = ""
    while (!this.eof() && this.peek() !== "]") {
      const char = this.next()
      raw += char
      if (char === "\\" && !this.eof()) {
        raw += this.next()
      }
    }
    if (this.eof()) {
      throw new RegexParseError("Unterminated character class, expected ]", start)
    }
    this.next()

    return this.charClassToNode(raw, negated)
  }

  private charClassToNode(raw: string, negated: boolean): AstNode {
    if (!negated) {
      if (raw === "a-zA-Z" || raw === "A-Za-z") return { type: "letter" }
      if (raw === "A-Z") return { type: "uppercase" }
      if (raw === "a-z") return { type: "lowercase" }
      if (raw === "0-9") return { type: "digit" }
    }

    const node: CharSetNode = {
      type: "charSet",
      negated,
      uppercase: false,
      lowercase: false,
      digits: false,
      underscore: false,
      space: false,
      custom: "",
    }

    let rest = raw
    const consume = (token: string): boolean => {
      if (rest.includes(token)) {
        rest = rest.replace(token, "")
        return true
      }
      return false
    }

    node.uppercase = consume("A-Z")
    node.lowercase = consume("a-z")
    node.digits = consume("0-9") || consume("\\d")
    node.underscore = consume("_")
    node.space = consume(" ")
    node.custom = rest.replace(/\\(.)/g, "$1")
    return node
  }
}

export function parseRegex(pattern: string): AstNode {
  return new Parser(pattern).parse()
}

export function tryParseRegex(
  pattern: string,
): { ok: true; ast: AstNode } | { ok: false; error: string } {
  try {
    return { ok: true, ast: parseRegex(pattern) }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to parse pattern",
    }
  }
}
