"use client"

import { useMemo } from "react"
import { SlidersHorizontal } from "lucide-react"
import { useBuilderStore } from "@/store/builder-store"
import { getBlockDefinition, type BlockSettings } from "@/lib/blocks/definitions"
import { blockPreview } from "@/lib/blocks/preview"
import { validatePattern } from "@/lib/regex/generator"
import type { BlockNode } from "@/lib/flow/graph-to-ast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const QUANTIFIER_TYPES = new Set(["optional", "zeroOrMore", "oneOrMore", "repeat"])
const SET_TYPES = new Set(["charSet", "negatedSet"])

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  )
}

function SetCheckbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      <Label htmlFor={id} className="text-xs font-normal">
        {label}
      </Label>
    </div>
  )
}

function NodeSettings({ node }: { node: BlockNode }) {
  const updateSettings = useBuilderStore((state) => state.updateSettings)
  const definition = getBlockDefinition(node.data.blockType)
  const settings = node.data.settings
  const type = node.data.blockType

  const update = (partial: Partial<BlockSettings>): void => updateSettings(node.id, partial)

  const customValidation = useMemo(
    () => (type === "custom" ? validatePattern(settings.pattern) : null),
    [type, settings.pattern],
  )

  const preview = blockPreview(type, settings)
  const Icon = definition.icon
  const hasSettings =
    type === "text" ||
    QUANTIFIER_TYPES.has(type) ||
    SET_TYPES.has(type) ||
    type === "namedGroup" ||
    type === "either" ||
    type === "escape" ||
    type === "literal" ||
    type === "custom" ||
    type === "comment"

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{definition.label}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{definition.description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Output</span>
        <code className="break-all rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
          {preview.length > 0 ? preview : "(empty)"}
        </code>
      </div>

      {hasSettings && <Separator />}

      {type === "text" && (
        <Field label="Text to match" htmlFor="prop-text">
          <Input
            id="prop-text"
            value={settings.text}
            onChange={(event) => update({ text: event.target.value })}
            placeholder="hello"
          />
        </Field>
      )}

      {type === "repeat" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Minimum" htmlFor="prop-min">
            <Input
              id="prop-min"
              type="number"
              min={0}
              value={settings.min}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10)
                if (!Number.isNaN(value) && value >= 0) update({ min: value })
              }}
            />
          </Field>
          <Field label="Maximum" htmlFor="prop-max">
            <Input
              id="prop-max"
              type="number"
              min={0}
              value={settings.max ?? ""}
              placeholder="∞"
              onChange={(event) => {
                if (event.target.value === "") {
                  update({ max: null })
                  return
                }
                const value = Number.parseInt(event.target.value, 10)
                if (!Number.isNaN(value) && value >= 0) update({ max: value })
              }}
            />
          </Field>
        </div>
      )}

      {QUANTIFIER_TYPES.has(type) && (
        <div className="flex items-center justify-between">
          <Label htmlFor="prop-lazy" className="text-xs">
            Lazy (match as few as possible)
          </Label>
          <Switch
            id="prop-lazy"
            checked={settings.lazy}
            onCheckedChange={(checked) => update({ lazy: checked === true })}
          />
        </div>
      )}

      {SET_TYPES.has(type) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="prop-negated" className="text-xs">
              Negated (must NOT match)
            </Label>
            <Switch
              id="prop-negated"
              checked={settings.negated}
              onCheckedChange={(checked) => update({ negated: checked === true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <SetCheckbox
              id="prop-upper"
              label="Uppercase letters (A-Z)"
              checked={settings.uppercase}
              onChange={(value) => update({ uppercase: value })}
            />
            <SetCheckbox
              id="prop-lower"
              label="Lowercase letters (a-z)"
              checked={settings.lowercase}
              onChange={(value) => update({ lowercase: value })}
            />
            <SetCheckbox
              id="prop-digits"
              label="Digits (0-9)"
              checked={settings.digits}
              onChange={(value) => update({ digits: value })}
            />
            <SetCheckbox
              id="prop-underscore"
              label="Underscore (_)"
              checked={settings.underscore}
              onChange={(value) => update({ underscore: value })}
            />
            <SetCheckbox
              id="prop-space"
              label="Space"
              checked={settings.space}
              onChange={(value) => update({ space: value })}
            />
          </div>
          <Field label="Custom characters" htmlFor="prop-custom-chars">
            <Input
              id="prop-custom-chars"
              value={settings.custom}
              onChange={(event) => update({ custom: event.target.value })}
              placeholder=".-@"
            />
          </Field>
        </div>
      )}

      {type === "namedGroup" && (
        <Field label="Group name" htmlFor="prop-name">
          <Input
            id="prop-name"
            value={settings.name}
            onChange={(event) => update({ name: event.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
            placeholder="name"
          />
        </Field>
      )}

      {type === "either" && (
        <Field label="Number of branches" htmlFor="prop-branches">
          <Input
            id="prop-branches"
            type="number"
            min={2}
            max={6}
            value={settings.branches}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value, 10)
              if (!Number.isNaN(value) && value >= 2 && value <= 6) update({ branches: value })
            }}
          />
        </Field>
      )}

      {(type === "escape" || type === "literal") && (
        <Field label="Character" htmlFor="prop-value">
          <Input
            id="prop-value"
            value={settings.value}
            maxLength={1}
            onChange={(event) => update({ value: event.target.value.slice(0, 1) })}
            placeholder="-"
          />
        </Field>
      )}

      {type === "custom" && (
        <Field label="Raw regex pattern" htmlFor="prop-pattern">
          <div className="flex flex-col gap-1.5">
            <Input
              id="prop-pattern"
              value={settings.pattern}
              onChange={(event) => update({ pattern: event.target.value })}
              placeholder="\d{2}"
              className="font-mono"
              aria-invalid={customValidation !== null && !customValidation.valid}
            />
            {customValidation !== null && !customValidation.valid && (
              <p className="text-xs text-destructive" role="alert">
                {customValidation.error}
              </p>
            )}
          </div>
        </Field>
      )}

      {type === "comment" && (
        <Field label="Note" htmlFor="prop-comment">
          <Textarea
            id="prop-comment"
            value={settings.comment}
            onChange={(event) => update({ comment: event.target.value })}
            placeholder="Describe this part of the pattern"
            rows={3}
          />
        </Field>
      )}
    </div>
  )
}

export function PropertiesPanel() {
  const nodes = useBuilderStore((state) => state.nodes)
  const selected = nodes.filter((node) => node.selected)

  return (
    <aside className="flex h-full flex-col bg-background" aria-label="Block properties">
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <SlidersHorizontal className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </h2>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {selected.length === 1 ? (
          <NodeSettings key={selected[0].id} node={selected[0]} />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {selected.length === 0
                ? "Select a block on the canvas to edit its settings."
                : `${selected.length} blocks selected. Select a single block to edit its settings.`}
            </p>
          </div>
        )}
      </ScrollArea>
    </aside>
  )
}
