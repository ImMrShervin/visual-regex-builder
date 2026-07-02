import type { BlockSettings, BlockType } from "./definitions"
import { generateRegex, escapeText } from "@/lib/regex/generator"

export function blockPreview(type: BlockType, settings: BlockSettings): string {
  switch (type) {
    case "start":
      return "^"
    case "end":
      return "$"
    case "text":
      return escapeText(settings.text)
    case "digit":
      return "\\d"
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
    case "negatedSet":
      return generateRegex({
        type: "charSet",
        negated: settings.negated,
        uppercase: settings.uppercase,
        lowercase: settings.lowercase,
        digits: settings.digits,
        underscore: settings.underscore,
        space: settings.space,
        custom: settings.custom,
      })
    case "optional":
      return settings.lazy ? "??" : "?"
    case "zeroOrMore":
      return settings.lazy ? "*?" : "*"
    case "oneOrMore":
      return settings.lazy ? "+?" : "+"
    case "repeat": {
      const max = settings.max
      const body =
        max === null
          ? `{${settings.min},}`
          : max === settings.min
            ? `{${settings.min}}`
            : `{${settings.min},${max}}`
      return settings.lazy ? `${body}?` : body
    }
    case "group":
      return "( … )"
    case "namedGroup":
      return `(?<${settings.name.length > 0 ? settings.name : "name"}> … )`
    case "nonCapturingGroup":
      return "(?: … )"
    case "lookahead":
      return "(?= … )"
    case "negativeLookahead":
      return "(?! … )"
    case "lookbehind":
      return "(?<= … )"
    case "negativeLookbehind":
      return "(?<! … )"
    case "either":
      return "a|b"
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
    case "escape":
      return settings.value.length > 0 ? `\\${settings.value[0]}` : "\\"
    case "literal":
      return settings.value.length > 0 ? escapeText(settings.value[0]) : ""
    case "custom":
      return settings.pattern
    case "comment":
      return "#"
  }
}
