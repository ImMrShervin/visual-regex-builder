# Visual Regex Builder

A visual, node-based tool for building regular expressions without writing a single line of regex code. Drag blocks onto a canvas, connect them together, and watch your pattern come to life in real time.


## Use Cases

### Form Validation

Build and test patterns for validating user input such as email addresses, phone numbers, passwords, and usernames. Connect an Email block, test it against real addresses, and export the validated regex directly into your form logic.

### Data Extraction

Design patterns to pull structured data out of raw text. Extract dates from log files, IP addresses from server output, or hex color codes from CSS. The tester panel lets you paste real data and see exactly what gets matched before you ship the pattern.

### API Request Routing

Create route-matching patterns for frameworks like Express, FastAPI, or Go's net/http. Build path parameters, wildcards, and optional segments visually, then copy the result into your router configuration.

### Search and Replace

Craft precise find-and-replace patterns for refactoring code or cleaning up datasets. The explanation panel breaks down every part of your pattern so you can verify the logic before running bulk replacements.

### Log Analysis

Construct filters for parsing server logs, error messages, or monitoring output. Combine quantifiers, groups, and anchors to pinpoint exactly the lines you need, then export the pattern to your log aggregation tool.

### Text Processing

Build patterns for splitting, trimming, or transforming text in scripts and automation workflows. Test against sample strings to make sure edge cases are handled before deploying to production.

### Education and Learning

Use the explanation panel as a learning aid. Every block you place generates a human-readable description of what that regex component does, making it an effective teaching tool for regex fundamentals.

## Key Features

### Visual Block System

Over 30 block types organized into categories: Anchors, Characters, Character Sets, Quantifiers, Groups, Lookaround, Special Characters, and Advanced. Each block represents a specific regex concept and can be configured through a properties panel.

### Real-Time Pattern Generation

The generated regex updates instantly as you add, remove, or modify blocks on the canvas. No manual editing needed -- the pattern is always in sync with your visual layout.

### Built-In Tester

Type or paste any test string into the tester panel. Matches are highlighted in real time, and you can inspect each match including capture groups and named groups. This eliminates the back-and-forth between your editor and a regex testing site.

### Pattern Library

Start from one of the built-in presets organized by category:

- **Contact**: Email, International Phone, Iranian Mobile
- **Web**: URL Slug, IPv4 Address, Hex Color
- **Numbers**: Integer, Decimal, Number with Commas
- **Dates & Time**: ISO Date, 24-Hour Time
- **Identifiers**: Username, Strong Password, Iranian National ID, UUID v4

Load any preset onto the canvas, tweak it to fit your needs, and export the result.

### Import and Export

Export your finished regex to JavaScript, Python, or Go syntax. Import an existing regex pattern as JSON to continue editing it visually. Copy the pattern to your clipboard with a single click.

### Explanation Panel

Every component in your pattern gets a plain-English explanation. This is useful for code reviews, documentation, or simply understanding what a complex pattern actually does.

### Keyboard Shortcuts

Speed up your workflow with standard shortcuts: Undo, Redo, Copy, Paste, Duplicate, Select All, and Delete. Everything you need for rapid iteration without touching the mouse.

### Dark and Light Themes

Switch between dark and light mode to match your preference or working environment. All panels and components respect the active theme.

### Persistent State

Your canvas, blocks, and test input are saved automatically to local storage. Close the browser, come back later, and everything is exactly where you left it.

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm (recommended) or npm

### Installation

```bash
git clone https://github.com/ImMrShervin/visual-regex-builder
.git
cd visual-regex-builder
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | App framework and server-side rendering |
| React 19 | UI library |
| TypeScript 5.7 | Type safety and developer experience |
| Tailwind CSS 4.2 | Utility-first styling |
| Zustand 5.0 | Lightweight state management |
| React Flow 12.11 | Interactive node-based canvas |
| shadcn/ui 4.8 | Accessible UI components |
| Lucide React 1.16 | Icon set |
| Vitest 4.1 | Unit testing |

## How It Works

1. Pick a block from the sidebar and drag it onto the canvas
2. Connect the output of one block to the input of the next
3. Select a block to configure its settings in the properties panel
4. Watch the generated regex update in real time in the regex bar
5. Type test input to see matches highlighted instantly
6. Copy the pattern or export it in your preferred language

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, make your changes, and open a pull request. Please ensure your code passes linting and tests before submitting.

