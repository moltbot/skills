/**
 * Snapshot and element detection utilities
 */

import type { ElementRef, Snapshot } from '../types.js'

/**
 * Parse accessibility tree snapshot from agent-browser
 */
export function parseSnapshot(output: string, url: string): Snapshot {
  const refs = new Map<string, ElementRef>()
  const lines = output.split('\n')
  
  // Parse element refs from accessibility tree
  // Format: @e42 button "Submit"
  const refPattern = /(@e\d+)\s+(\w+)\s+"([^"]*)"(?:\s+(.+))?/
  
  for (const line of lines) {
    const match = line.match(refPattern)
    if (match) {
      const [, id, role, name, stateStr] = match
      const ref: ElementRef = { id, role, name }
      
      if (stateStr) {
        ref.state = parseState(stateStr)
      }
      
      refs.set(id, ref)
      // Also index by role:name for easier lookup
      refs.set(`${role.toLowerCase()}:${name.toLowerCase()}`, ref)
    }
  }
  
  // Extract title if present
  let title = ''
  const titleMatch = output.match(/document\s+"([^"]+)"/)
  if (titleMatch) {
    title = titleMatch[1]
  }
  
  return {
    tree: output,
    refs,
    url,
    title,
    consoleEvents: [],
    timestamp: Date.now()
  }
}

/**
 * Parse element state from snapshot
 */
function parseState(stateStr: string): ElementRef['state'] {
  const state: ElementRef['state'] = {}
  
  if (stateStr.includes('disabled')) state.disabled = true
  if (stateStr.includes('checked')) state.checked = true
  if (stateStr.includes('selected')) state.selected = true
  if (stateStr.includes('expanded')) state.expanded = true
  if (stateStr.includes('pressed')) state.pressed = true
  
  return state
}

/**
 * Find element by role and name
 */
export function findByRole(
  snapshot: Snapshot,
  role: string,
  name?: string
): ElementRef | undefined {
  for (const [, ref] of snapshot.refs) {
    if (ref.role.toLowerCase() === role.toLowerCase()) {
      if (!name || ref.name.toLowerCase().includes(name.toLowerCase())) {
        return ref
      }
    }
  }
  return undefined
}

/**
 * Find all elements matching role
 */
export function findAllByRole(snapshot: Snapshot, role: string): ElementRef[] {
  const results: ElementRef[] = []
  for (const [key, ref] of snapshot.refs) {
    // Only include direct refs, not the role:name aliases
    if (key.startsWith('@') && ref.role.toLowerCase() === role.toLowerCase()) {
      results.push(ref)
    }
  }
  return results
}

/**
 * Find element by text content
 */
export function findByText(
  snapshot: Snapshot,
  text: string,
  options: { exact?: boolean } = {}
): ElementRef | undefined {
  const searchText = text.toLowerCase()
  
  for (const [key, ref] of snapshot.refs) {
    if (!key.startsWith('@')) continue
    
    const refText = ref.name.toLowerCase()
    if (options.exact ? refText === searchText : refText.includes(searchText)) {
      return ref
    }
  }
  return undefined
}

/**
 * Check if element exists in snapshot
 */
export function elementExists(snapshot: Snapshot, refOrSelector: string): boolean {
  // Direct ref check
  if (refOrSelector.startsWith('@')) {
    return snapshot.refs.has(refOrSelector)
  }
  
  // Role:name format
  if (refOrSelector.includes(':')) {
    return snapshot.refs.has(refOrSelector.toLowerCase())
  }
  
  // Search by text
  return findByText(snapshot, refOrSelector) !== undefined
}

/**
 * Get ref ID from selector or return as-is if already a ref
 */
export function resolveRef(snapshot: Snapshot, selector: string): string | undefined {
  // Already a ref
  if (selector.startsWith('@')) {
    return snapshot.refs.has(selector) ? selector : undefined
  }
  
  // Role:name format
  if (selector.includes(':')) {
    const ref = snapshot.refs.get(selector.toLowerCase())
    return ref?.id
  }
  
  // Search by text
  const found = findByText(snapshot, selector)
  return found?.id
}

/**
 * Detect stale refs by comparing snapshots
 */
export function detectStaleRefs(oldSnapshot: Snapshot, newSnapshot: Snapshot): string[] {
  const stale: string[] = []
  
  for (const [key] of oldSnapshot.refs) {
    if (key.startsWith('@') && !newSnapshot.refs.has(key)) {
      stale.push(key)
    }
  }
  
  return stale
}

/**
 * Detect modals/dialogs in snapshot
 */
export function detectModals(snapshot: Snapshot): ElementRef[] {
  const modals: ElementRef[] = []
  
  for (const [key, ref] of snapshot.refs) {
    if (!key.startsWith('@')) continue
    
    const isModal = 
      ref.role === 'dialog' ||
      ref.role === 'alertdialog' ||
      ref.name.toLowerCase().includes('modal') ||
      ref.name.toLowerCase().includes('popup')
    
    if (isModal) {
      modals.push(ref)
    }
  }
  
  return modals
}

/**
 * Extract interactive elements
 */
export function getInteractiveElements(snapshot: Snapshot): ElementRef[] {
  const interactive: ElementRef[] = []
  const interactiveRoles = [
    'button', 'link', 'textbox', 'checkbox', 'radio',
    'combobox', 'listbox', 'menuitem', 'tab', 'switch'
  ]
  
  for (const [key, ref] of snapshot.refs) {
    if (!key.startsWith('@')) continue
    
    if (interactiveRoles.includes(ref.role.toLowerCase())) {
      interactive.push(ref)
    }
  }
  
  return interactive
}

/**
 * Diff two snapshots to detect changes
 */
export function diffSnapshots(
  before: Snapshot,
  after: Snapshot
): { added: ElementRef[]; removed: string[]; changed: string[] } {
  const added: ElementRef[] = []
  const removed: string[] = []
  const changed: string[] = []
  
  // Find removed and changed
  for (const [key, oldRef] of before.refs) {
    if (!key.startsWith('@')) continue
    
    const newRef = after.refs.get(key)
    if (!newRef) {
      removed.push(key)
    } else if (
      oldRef.name !== newRef.name ||
      JSON.stringify(oldRef.state) !== JSON.stringify(newRef.state)
    ) {
      changed.push(key)
    }
  }
  
  // Find added
  for (const [key, ref] of after.refs) {
    if (!key.startsWith('@')) continue
    
    if (!before.refs.has(key)) {
      added.push(ref)
    }
  }
  
  return { added, removed, changed }
}
