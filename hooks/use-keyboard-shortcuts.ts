"use client"

import { useEffect } from "react"
import { useBuilderStore } from "@/store/builder-store"

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  )
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (isEditableTarget(event.target)) return

      const store = useBuilderStore.getState()
      const mod = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()

      if (mod && key === "z" && !event.shiftKey) {
        event.preventDefault()
        store.undo()
      } else if ((mod && key === "z" && event.shiftKey) || (mod && key === "y")) {
        event.preventDefault()
        store.redo()
      } else if (mod && key === "c") {
        store.copySelection()
      } else if (mod && key === "v") {
        store.paste()
      } else if (mod && key === "d") {
        event.preventDefault()
        store.duplicateSelection()
      } else if (mod && key === "a") {
        event.preventDefault()
        store.selectAll()
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        store.deleteSelection()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
