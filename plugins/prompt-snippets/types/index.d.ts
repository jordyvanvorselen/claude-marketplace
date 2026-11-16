export type Placement = 'prepend' | 'append'

export type Snippet = {
  /** Filename, e.g. "diagnose-report.md" */
  id: string
  name: string
  description: string
  placement: Placement
  order: number
  body: string
}

declare module 'claude-code' {
  interface PluginState {
    'prompt-snippets': {
      /** Snippets last read from disk, prepend group first, each group by (order, name). */
      snippets: Shaped<Snippet[]>
      /** Ids applied to the next message. Cleared after each send and at session start. */
      enabled: string[]
      /** Whether the menu is drawn in the band above the prompt. */
      isMenuOpen: boolean
      /** The key of the band element holding the focus ring, as `ui.focus` last named it. */
      focused: string | null
      /** Which snippet the menu previews under the list, or null for none. */
      previewing: string | null
    }
  }
}
