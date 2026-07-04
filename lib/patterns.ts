export interface PatternPreset {
  id: string
  name: string
  description: string
  pattern: string
  sampleInput: string
  category: PatternCategory
}

export type PatternCategory = "Contact" | "Web" | "Numbers" | "Dates & Time" | "Identifiers"

export const PATTERN_CATEGORIES: PatternCategory[] = [
  "Contact",
  "Web",
  "Numbers",
  "Dates & Time",
  "Identifiers",
]
 
export const PATTERN_PRESETS: PatternPreset[] = [
  {
    id: "email",
    name: "Email address",
    description: "Matches a standard email like name@example.com",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    sampleInput: "name@example.com",
    category: "Contact",
  },
  {
    id: "phone-intl",
    name: "International phone",
    description: "Optional + prefix followed by 7 to 15 digits",
    pattern: "^\\+?[0-9]{7,15}$",
    sampleInput: "+14155552671",
    category: "Contact",
  },
  {
    id: "phone-ir",
    name: "Iranian mobile",
    description: "Iranian mobile numbers starting with 09",
    pattern: "^09\\d{9}$",
    sampleInput: "09123456789",
    category: "Contact",
  },
  {
    id: "slug",
    name: "URL slug",
    description: "Lowercase words separated by single hyphens",
    pattern: "^[a-z0-9]+(-[a-z0-9]+)*$",
    sampleInput: "my-blog-post-42",
    category: "Web",
  },
  {
    id: "ipv4",
    name: "IPv4 address",
    description: "Four dot-separated groups of 1-3 digits",
    pattern: "^(\\d{1,3}\\.){3}\\d{1,3}$",
    sampleInput: "192.168.1.1",
    category: "Web",
  },
  {
    id: "hex-color",
    name: "Hex color",
    description: "A # followed by 3 or 6 hex digits",
    pattern: "^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$",
    sampleInput: "#1a2b3c",
    category: "Web",
  },
  {
    id: "integer",
    name: "Integer",
    description: "A whole number with an optional minus sign",
    pattern: "^-?\\d+$",
    sampleInput: "-1234",
    category: "Numbers",
  },
  {
    id: "decimal",
    name: "Decimal number",
    description: "A number with an optional fractional part",
    pattern: "^-?\\d+(\\.\\d+)?$",
    sampleInput: "3.14159",
    category: "Numbers",
  },
  {
    id: "thousands",
    name: "Number with commas",
    description: "Digits grouped in thousands, like 1,234,567",
    pattern: "^\\d{1,3}(,\\d{3})*$",
    sampleInput: "1,234,567",
    category: "Numbers",
  },
  {
    id: "date-iso",
    name: "Date (YYYY-MM-DD)",
    description: "ISO-style date such as 2026-07-02",
    pattern: "^\\d{4}-\\d{2}-\\d{2}$",
    sampleInput: "2026-07-02",
    category: "Dates & Time",
  },
  {
    id: "time-24h",
    name: "Time (24-hour)",
    description: "HH:MM in 24-hour format",
    pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
    sampleInput: "23:45",
    category: "Dates & Time",
  },
  {
    id: "username",
    name: "Username",
    description: "3-16 letters, digits, or underscores",
    pattern: "^[a-zA-Z0-9_]{3,16}$",
    sampleInput: "cool_user42",
    category: "Identifiers",
  },
  {
    id: "password-strong",
    name: "Strong password",
    description: "At least 8 chars with lowercase, uppercase, and a digit",
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
    sampleInput: "Sup3rSecret",
    category: "Identifiers",
  },
  {
    id: "national-id-ir",
    name: "Iranian national ID",
    description: "Exactly 10 digits (کد ملی)",
    pattern: "^\\d{10}$",
    sampleInput: "0012345678",
    category: "Identifiers",
  },
  {
    id: "uuid",
    name: "UUID v4",
    description: "Standard UUID like 550e8400-e29b-41d4-a716-446655440000",
    pattern:
      "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    sampleInput: "550e8400-e29b-41d4-a716-446655440000",
    category: "Identifiers",
  },
]
