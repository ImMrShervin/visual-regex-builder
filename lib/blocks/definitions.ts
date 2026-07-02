import type { LucideIcon } from "lucide-react"
import {
  ALargeSmall,
  Anchor,
  ArrowBigRight,
  ArrowRightToLine,
  AsteriskSquare,
  Binary,
  Braces,
  Brackets,
  CaseLower,
  CaseSensitive,
  CaseUpper,
  CircleDot,
  CircleOff,
  CircleSlash,
  CornerDownLeft,
  Eye,
  EyeOff,
  FileQuestion,
  Group,
  Hash,
  Indent,
  MessageSquare,
  MoveHorizontal,
  Parentheses,
  Plus,
  Quote,
  Regex,
  Repeat,
  ScanEye,
  ScanSearch,
  SkipBack,
  Space,
  Split,
  Tag,
  Type,
  WholeWord,
} from "lucide-react"

export type BlockType =
  | "start"
  | "end"
  | "text"
  | "digit"
  | "letter"
  | "uppercase"
  | "lowercase"
  | "whitespace"
  | "nonWhitespace"
  | "word"
  | "nonWord"
  | "any"
  | "number"
  | "charSet"
  | "negatedSet"
  | "optional"
  | "zeroOrMore"
  | "oneOrMore"
  | "repeat"
  | "group"
  | "namedGroup"
  | "nonCapturingGroup"
  | "lookahead"
  | "negativeLookahead"
  | "lookbehind"
  | "negativeLookbehind"
  | "either"
  | "boundary"
  | "nonBoundary"
  | "tab"
  | "newline"
  | "carriageReturn"
  | "escape"
  | "literal"
  | "custom"
  | "comment"

export interface BlockSettings {
  text: string
  min: number
  max: number | null
  lazy: boolean
  name: string
  negated: boolean
  uppercase: boolean
  lowercase: boolean
  digits: boolean
  underscore: boolean
  space: boolean
  custom: string
  value: string
  pattern: string
  comment: string
  branches: number
}

export const DEFAULT_SETTINGS: BlockSettings = {
  text: "text",
  min: 1,
  max: 3,
  lazy: false,
  name: "name",
  negated: false,
  uppercase: true,
  lowercase: true,
  digits: true,
  underscore: false,
  space: false,
  custom: "",
  value: "",
  pattern: "",
  comment: "",
  branches: 2,
}

export type BlockCategory =
  | "Anchors"
  | "Characters"
  | "Character Sets"
  | "Quantifiers"
  | "Groups"
  | "Lookaround"
  | "Special Characters"
  | "Advanced"

export const BLOCK_CATEGORIES: BlockCategory[] = [
  "Anchors",
  "Characters",
  "Character Sets",
  "Quantifiers",
  "Groups",
  "Lookaround",
  "Special Characters",
  "Advanced",
]

export interface BlockDefinition {
  type: BlockType
  label: string
  description: string
  category: BlockCategory
  icon: LucideIcon
  isQuantifier: boolean
  isContainer: boolean
  isBranching: boolean
  defaults: Partial<BlockSettings>
}

const def = (
  type: BlockType,
  label: string,
  description: string,
  category: BlockCategory,
  icon: LucideIcon,
  options: Partial<
    Pick<BlockDefinition, "isQuantifier" | "isContainer" | "isBranching" | "defaults">
  > = {},
): BlockDefinition => ({
  type,
  label,
  description,
  category,
  icon,
  isQuantifier: options.isQuantifier ?? false,
  isContainer: options.isContainer ?? false,
  isBranching: options.isBranching ?? false,
  defaults: options.defaults ?? {},
})

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  def("start", "Start", "Matches the start of the string (^)", "Anchors", ArrowBigRight),
  def("end", "End", "Matches the end of the string ($)", "Anchors", ArrowRightToLine),
  def("boundary", "Boundary", "Word boundary (\\b)", "Anchors", Anchor),
  def("nonBoundary", "Non Boundary", "Not a word boundary (\\B)", "Anchors", CircleSlash),

  def("text", "Text", "Matches literal text, auto-escaped", "Characters", Type, {
    defaults: { text: "text" },
  }),
  def("digit", "Digit", "Any digit 0-9 (\\d)", "Characters", Hash),
  def("letter", "Letter", "Any letter a-z or A-Z", "Characters", CaseSensitive),
  def("uppercase", "Uppercase Letter", "Any uppercase letter A-Z", "Characters", CaseUpper),
  def("lowercase", "Lowercase Letter", "Any lowercase letter a-z", "Characters", CaseLower),
  def("whitespace", "Whitespace", "Space, tab or newline (\\s)", "Characters", Space),
  def("nonWhitespace", "Non Whitespace", "Anything but whitespace (\\S)", "Characters", CircleOff),
  def("word", "Word Character", "Letter, digit or underscore (\\w)", "Characters", WholeWord),
  def("nonWord", "Non Word Character", "Not a word character (\\W)", "Characters", ALargeSmall),
  def("any", "Any Character", "Any single character (.)", "Characters", CircleDot),
  def("number", "Number", "One or more digits (\\d+)", "Characters", Binary),

  def("charSet", "Character Set", "A custom set of allowed characters", "Character Sets", Brackets, {
    defaults: { negated: false, uppercase: true, lowercase: true, digits: true },
  }),
  def(
    "negatedSet",
    "Negated Set",
    "A set of characters that must NOT match",
    "Character Sets",
    Braces,
    { defaults: { negated: true, uppercase: false, lowercase: false, digits: true } },
  ),

  def("optional", "Optional", "Previous block zero or one time (?)", "Quantifiers", FileQuestion, {
    isQuantifier: true,
  }),
  def(
    "zeroOrMore",
    "Zero Or More",
    "Previous block zero or more times (*)",
    "Quantifiers",
    AsteriskSquare,
    { isQuantifier: true },
  ),
  def("oneOrMore", "One Or More", "Previous block one or more times (+)", "Quantifiers", Plus, {
    isQuantifier: true,
  }),
  def("repeat", "Repeat", "Previous block between min and max times", "Quantifiers", Repeat, {
    isQuantifier: true,
    defaults: { min: 3, max: 5 },
  }),

  def("group", "Group", "Capturing group ( ... )", "Groups", Parentheses, { isContainer: true }),
  def("namedGroup", "Named Group", "Named capturing group (?<name> ... )", "Groups", Tag, {
    isContainer: true,
    defaults: { name: "name" },
  }),
  def(
    "nonCapturingGroup",
    "Non Capturing Group",
    "Groups without capturing (?: ... )",
    "Groups",
    Group,
    { isContainer: true },
  ),
  def("either", "Either (OR)", "Matches one of several branches (a|b)", "Groups", Split, {
    isBranching: true,
    defaults: { branches: 2 },
  }),

  def("lookahead", "Lookahead", "Must be followed by ... (?= )", "Lookaround", Eye, {
    isContainer: true,
  }),
  def(
    "negativeLookahead",
    "Negative Lookahead",
    "Must NOT be followed by ... (?! )",
    "Lookaround",
    EyeOff,
    { isContainer: true },
  ),
  def("lookbehind", "Lookbehind", "Must be preceded by ... (?<= )", "Lookaround", ScanEye, {
    isContainer: true,
  }),
  def(
    "negativeLookbehind",
    "Negative Lookbehind",
    "Must NOT be preceded by ... (?<! )",
    "Lookaround",
    ScanSearch,
    { isContainer: true },
  ),

  def("tab", "Tab", "Tab character (\\t)", "Special Characters", Indent),
  def("newline", "Newline", "Newline character (\\n)", "Special Characters", CornerDownLeft),
  def(
    "carriageReturn",
    "Carriage Return",
    "Carriage return character (\\r)",
    "Special Characters",
    SkipBack,
  ),
  def(
    "escape",
    "Escape Character",
    "Escapes a single character with a backslash",
    "Special Characters",
    MoveHorizontal,
    { defaults: { value: "." } },
  ),
  def(
    "literal",
    "Literal Character",
    "A single literal character, auto-escaped",
    "Special Characters",
    Quote,
    { defaults: { value: "-" } },
  ),

  def("custom", "Custom Regex", "Raw regex fragment inserted as-is", "Advanced", Regex, {
    defaults: { pattern: "\\d{2}" },
  }),
  def("comment", "Comment", "A note on the canvas, produces no output", "Advanced", MessageSquare, {
    defaults: { comment: "note" },
  }),
]

const definitionMap = new Map<BlockType, BlockDefinition>(
  BLOCK_DEFINITIONS.map((definition) => [definition.type, definition]),
)

export function getBlockDefinition(type: BlockType): BlockDefinition {
  const definition = definitionMap.get(type)
  if (definition === undefined) {
    throw new Error(`Unknown block type: ${type}`)
  }
  return definition
}

export function createBlockSettings(type: BlockType): BlockSettings {
  return { ...DEFAULT_SETTINGS, ...getBlockDefinition(type).defaults }
}
