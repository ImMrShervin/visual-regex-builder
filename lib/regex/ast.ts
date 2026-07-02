export type QuantifierKind = "optional" | "zeroOrMore" | "oneOrMore" | "repeat"
export type GroupKind = "capturing" | "named" | "nonCapturing"
export type LookaroundKind =
  | "lookahead"
  | "negativeLookahead"
  | "lookbehind"
  | "negativeLookbehind"

export interface SequenceNode {
  type: "sequence"
  children: AstNode[]
}

export interface StartNode {
  type: "start"
}

export interface EndNode {
  type: "end"
}

export interface TextNode {
  type: "text"
  value: string
}

export interface DigitNode {
  type: "digit"
}

export interface NonDigitNode {
  type: "nonDigit"
}

export interface LetterNode {
  type: "letter"
}

export interface UppercaseNode {
  type: "uppercase"
}

export interface LowercaseNode {
  type: "lowercase"
}

export interface WhitespaceNode {
  type: "whitespace"
}

export interface NonWhitespaceNode {
  type: "nonWhitespace"
}

export interface WordNode {
  type: "word"
}

export interface NonWordNode {
  type: "nonWord"
}

export interface AnyNode {
  type: "any"
}

export interface NumberNode {
  type: "number"
}

export interface CharSetNode {
  type: "charSet"
  negated: boolean
  uppercase: boolean
  lowercase: boolean
  digits: boolean
  underscore: boolean
  space: boolean
  custom: string
}

export interface QuantifierNode {
  type: "quantifier"
  kind: QuantifierKind
  min: number
  max: number | null
  lazy: boolean
  child: AstNode
}

export interface GroupNode {
  type: "group"
  kind: GroupKind
  name: string | null
  child: AstNode
}

export interface LookaroundNode {
  type: "lookaround"
  kind: LookaroundKind
  child: AstNode
}

export interface AlternationNode {
  type: "alternation"
  branches: AstNode[]
}

export interface BoundaryNode {
  type: "boundary"
}

export interface NonBoundaryNode {
  type: "nonBoundary"
}

export interface TabNode {
  type: "tab"
}

export interface NewlineNode {
  type: "newline"
}

export interface CarriageReturnNode {
  type: "carriageReturn"
}

export interface EscapedNode {
  type: "escaped"
  value: string
}

export interface LiteralNode {
  type: "literal"
  value: string
}

export interface CustomNode {
  type: "custom"
  pattern: string
}

export interface CommentNode {
  type: "comment"
  text: string
}

export type AstNode =
  | SequenceNode
  | StartNode
  | EndNode
  | TextNode
  | DigitNode
  | NonDigitNode
  | LetterNode
  | UppercaseNode
  | LowercaseNode
  | WhitespaceNode
  | NonWhitespaceNode
  | WordNode
  | NonWordNode
  | AnyNode
  | NumberNode
  | CharSetNode
  | QuantifierNode
  | GroupNode
  | LookaroundNode
  | AlternationNode
  | BoundaryNode
  | NonBoundaryNode
  | TabNode
  | NewlineNode
  | CarriageReturnNode
  | EscapedNode
  | LiteralNode
  | CustomNode
  | CommentNode

export type AstNodeType = AstNode["type"]

export function sequence(children: AstNode[]): AstNode {
  if (children.length === 1) return children[0]
  return { type: "sequence", children }
}
