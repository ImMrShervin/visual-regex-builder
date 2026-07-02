export type ExportLanguage =
  | "javascript"
  | "python"
  | "java"
  | "csharp"
  | "go"
  | "php"

export interface ExportTarget {
  id: ExportLanguage
  label: string
  fileExtension: string
}

export const EXPORT_TARGETS: ExportTarget[] = [
  { id: "javascript", label: "JavaScript", fileExtension: "js" },
  { id: "python", label: "Python", fileExtension: "py" },
  { id: "java", label: "Java", fileExtension: "java" },
  { id: "csharp", label: "C#", fileExtension: "cs" },
  { id: "go", label: "Go", fileExtension: "go" },
  { id: "php", label: "PHP", fileExtension: "php" },
]

function escapeForDoubleQuotedString(pattern: string): string {
  return pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

export function exportSnippet(language: ExportLanguage, pattern: string): string {
  switch (language) {
    case "javascript":
      return `const regex = /${pattern.replace(/\//g, "\\/")}/;\n\nconst match = "your text".match(regex);`
    case "python":
      return `import re\n\npattern = re.compile(r"${pattern.replace(/"/g, '\\"')}")\n\nmatch = pattern.search("your text")`
    case "java":
      return `import java.util.regex.Pattern;\nimport java.util.regex.Matcher;\n\nPattern pattern = Pattern.compile("${escapeForDoubleQuotedString(pattern)}");\nMatcher matcher = pattern.matcher("your text");`
    case "csharp":
      return `using System.Text.RegularExpressions;\n\nvar regex = new Regex(@"${pattern.replace(/"/g, '""')}");\nvar match = regex.Match("your text");`
    case "go":
      return `package main\n\nimport "regexp"\n\nvar re = regexp.MustCompile(\`${pattern.replace(/`/g, "` + \"`\" + `")}\`)\n\nfunc main() {\n\tmatch := re.FindString("your text")\n\t_ = match\n}`
    case "php":
      return `<?php\n\n$pattern = '/${pattern.replace(/\//g, "\\/").replace(/'/g, "\\'")}/';\n\npreg_match($pattern, 'your text', $matches);`
  }
}
