import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Snippet } from '../types'
import { applySnippets, parseSnippet, sortSnippets } from './snippets'

/** The band's menu title: always drawn, so `abovePrompt:focus` has somewhere to land. */
export const TITLE_KEY = 'snippets'
export const CLOSE_KEY = 'close'
export const PREVIEW_KEY = 'preview'

/**
 * A mod cannot own a key: a Button borrows an engine action, and the chords the
 * person binds to it press the Button while no engine handler of that action is
 * mounted. `pane:next` is only handled while a pane holds the keyboard, so in the
 * AbovePrompt context it reaches the menu's close Button.
 */
export const CLOSE_ACTION = 'pane:next'

const snippets = atom({ plugin: 'prompt-snippets', key: 'snippets' } as const, [], {
  shape: 'snippets-1',
})
const enabled = atom({ plugin: 'prompt-snippets', key: 'enabled' } as const, [])
const isMenuOpen = atom({ plugin: 'prompt-snippets', key: 'isMenuOpen' } as const, false)
const focused = atom({ plugin: 'prompt-snippets', key: 'focused' } as const, null)
const previewing = atom({ plugin: 'prompt-snippets', key: 'previewing' } as const, null)

async function loadSnippets($: EngineInterface): Promise<Snippet[]> {
  const dir = `${$.plugin.root}/snippets`
  if (!(await $.fs.exists(dir))) return []

  const loaded: Snippet[] = []
  for (const entry of await $.fs.list(dir)) {
    if (entry.kind !== 'file' || !entry.name.toLowerCase().endsWith('.md')) continue
    try {
      const snippet = parseSnippet(entry.name, await $.fs.read(`${dir}/${entry.name}`))
      if (snippet) loaded.push(snippet)
    } catch {
      // An unreadable file is left out of the menu, as in the Pi extension.
    }
  }
  return sortSnippets(loaded)
}

/** Re-reads the folder and drops toggles of snippets that no longer exist. */
async function refresh($: EngineInterface): Promise<Snippet[]> {
  const fresh = await loadSnippets($)
  const ids = new Set(fresh.map(s => s.id))
  await update($, snippets, () => fresh)
  await update($, enabled, list => list.filter(id => ids.has(id)))
  return fresh
}

async function openMenu($: EngineInterface) {
  const fresh = await refresh($)
  if (fresh.length === 0) {
    $.ui.toast(`No snippets found in ${$.plugin.root}/snippets`)
    return
  }
  await update($, previewing, () => null)
  await update($, isMenuOpen, () => true)
}

async function closeMenu($: EngineInterface) {
  await update($, isMenuOpen, () => false)
  await update($, previewing, () => null)
}

async function toggleSnippet($: EngineInterface, id: string) {
  const all = await read($, snippets)
  await update($, enabled, list => {
    const set = new Set(list)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    return all.filter(s => set.has(s.id)).map(s => s.id)
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await update($, enabled, () => [])
    await closeMenu($)
    await refresh($)
    await $.command.register({
      name: 'snippets',
      description: 'Open or close the prompt snippets menu above the prompt',
    })
    return next(e)
  })

  on('command.run', { command: 'snippets' }, async $ => {
    if (await read($, isMenuOpen)) {
      await closeMenu($)
      return { text: 'Prompt snippets menu closed.' }
    }
    await openMenu($)
    return { text: 'Prompt snippets menu opened. Focus it with ctrl+x tab.' }
  })

  // ctrl+e is bound to `abovePrompt:focus`: the ring entering the band opens the menu.
  on('ui.focus', { component: 'AbovePrompt' }, async ($, e, next) => {
    await update($, focused, () => e.element ?? null)
    const isOpening = e.element === TITLE_KEY && !(await read($, isMenuOpen))
    if (!isOpening) return next(e)

    await openMenu($)
    const result = await next(e)
    const first = (await read($, snippets))[0]
    // Refused when the band lost the keys meanwhile: the ring then stays where it was.
    if (first) $.ui.focus({ requestId: e.requestId, key: first.id }).catch(() => undefined)
    return result
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta) return next(e)
    await closeMenu($)
    if ((await read($, enabled)).length === 0) return next(e)

    const fresh = await loadSnippets($)
    const chosen = new Set(await read($, enabled))
    const active = fresh.filter(s => chosen.has(s.id))
    await update($, snippets, () => fresh)
    await update($, enabled, () => [])

    if (active.length === 0) return next(e)
    return next({ ...e, text: applySnippets(e.text, active) })
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const all = await read($, snippets)
    const isOn = new Set(await read($, enabled))
    const active = all.filter(s => isOn.has(s.id))
    const prepends = all.filter(s => s.placement === 'prepend')
    const appends = all.filter(s => s.placement === 'append')
    const isOpen = await read($, isMenuOpen)

    if (!isOpen) {
      const activePrepends = active.filter(s => s.placement === 'prepend')
      const activeAppends = active.filter(s => s.placement === 'append')
      return (
        <Box flexDirection="column">
          <Button
            key={TITLE_KEY}
            action={CLOSE_ACTION}
            plain
            dimColor
            autoFocus
            onPress={async () => {
              await openMenu($)
              const first = (await read($, snippets))[0]
              if (first) await $.ui.focus({ requestId: e.requestId, key: first.id }).catch(() => undefined)
            }}
          >
            ctrl+e snippets
          </Button>
          {activePrepends.length > 0 && (
            <Text color="suggestion">↑ prepend: {activePrepends.map(s => s.name).join(' · ')}</Text>
          )}
          {activeAppends.length > 0 && (
            <Text color="warning">↓ append: {activeAppends.map(s => s.name).join(' · ')}</Text>
          )}
        </Box>
      )
    }

    const previewId = await read($, previewing)
    const preview = all.find(s => s.id === previewId)
    const row = (snippet: Snippet) => (
      <Button key={snippet.id} plain onPress={() => toggleSnippet($, snippet.id)}>
        <Text color={isOn.has(snippet.id) ? 'success' : undefined} dimColor={!isOn.has(snippet.id)}>
          {isOn.has(snippet.id) ? '[x]' : '[ ]'}
        </Text>{' '}
        <Text weight="bold">{snippet.name}</Text>
        {snippet.description ? <Text dimColor> — {snippet.description}</Text> : ''}
      </Button>
    )

    return (
      <Box flexDirection="column">
        <Text>
          <Text color="suggestion" weight="bold">Prompt snippets</Text>
          <Text dimColor>  j/k move · space toggle · p preview · ctrl+e close</Text>
        </Text>
        <Text dimColor>↑ PREPEND — added before your message</Text>
        {prepends.map(row)}
        <Text dimColor>↓ APPEND — added after your message</Text>
        {appends.map(row)}
        <Box flexDirection="row">
          <Button
            key={PREVIEW_KEY}
            hotkey="p"
            plain
            dimColor
            onPress={async () => {
              const id = await read($, focused)
              await update($, previewing, current =>
                current === id || !all.some(s => s.id === id) ? null : id,
              )
            }}
          >
            preview
          </Button>
          <Text dimColor> · </Text>
          <Button
            key={CLOSE_KEY}
            action={CLOSE_ACTION}
            plain
            dimColor
            onPress={() => closeMenu($)}
          >
            close
          </Button>
        </Box>
        {preview && (
          <Box flexDirection="column">
            <Text dimColor>
              ─ {preview.name} · {preview.placement} · order {preview.order} · {preview.id}
            </Text>
            {preview.body.split('\n').map(line => (
              <Text>{line === '' ? ' ' : line}</Text>
            ))}
          </Box>
        )}
      </Box>
    )
  })
}
