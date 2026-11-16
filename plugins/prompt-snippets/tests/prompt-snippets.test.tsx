import { expect, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

const FILES: Record<string, string> = {
  'lean.md': '---\nname: Lean\nplacement: prepend\norder: 20\n---\nKeep context lean.',
  'orchestrate.md': '---\nname: Orchestrate\nplacement: prepend\norder: 10\n---\nYou orchestrate.',
  'diagnose.md': '---\nname: Diagnose\ndescription: Read-only\norder: 40\n---\nDo not change code.',
  'push.md': '---\nname: Push\nplacement: append\norder: 30\n---\nPush once.',
  'notes.txt': 'not a snippet',
  'empty.md': '---\nname: Empty\n---\n',
}

const BAND = {
  plugin: 'prompt-snippets',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 30,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

type Engine = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

const typed = (text: string) => ({ text, wait: false, origin: { kind: 'composer' } as const })

/** Stands for the engine: a snippets folder holding FILES, and a prompt that enters as received. */
function engine(on: On) {
  on('fs.exists', () => ({ value: true }))
  on('fs.list', () => ({
    value: Object.keys(FILES).map(name => ({
      name,
      kind: 'file' as const,
      size: 1,
      mtimeMs: 0,
      isLink: false,
    })),
  }))
  on('fs.read', (_, e) => ({ value: FILES[e.path.split('/').pop() ?? ''] ?? '' }))
  on('command.register', () => ({ value: { command: 'snippets' } }))
  on('ui.focus', { plugin: '*' }, () => ({}))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.run', () => ({ text: '' }))
  on('prompt.submit', (_, e) => ({ text: e.text }))
}

async function start($: Engine) {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
}

async function focusBand($: Engine, element: string) {
  await $.ui.focus({
    component: 'AbovePrompt',
    requestId: 'above-prompt',
    element,
    plugin: 'prompt-snippets',
    origin: { kind: 'person' },
  })
}

/** ctrl+e is bound to `abovePrompt:focus`, which moves the band's ring onto the menu title. */
const pressCtrlE = ($: Engine) => focusBand($, 'snippets')

async function choose($: Engine, keys: string[]) {
  await pressCtrlE($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  for (const key of keys) await ui.press({ key })
  await ui.press({ key: 'close' })
  await ui.unmount()
}

test('focusing the band (ctrl+e) opens the menu with only markdown snippets that have a body', async ($, on) => {
  engine(on)
  await start($)

  const closed = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await closed.find({ key: 'orchestrate.md' })).toBeUndefined()
  await closed.unmount()

  await pressCtrlE($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ key: 'orchestrate.md' })).toBeDefined()
  expect(await ui.find({ key: 'diagnose.md' })).toBeDefined()
  expect(await ui.find({ key: 'notes.txt' })).toBeUndefined()
  expect(await ui.find({ key: 'empty.md' })).toBeUndefined()
  await ui.unmount()
})

test('the close button (ctrl+e in the band) closes the menu', async ($, on) => {
  engine(on)
  await start($)
  await choose($, [])

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ key: 'orchestrate.md' })).toBeUndefined()
  expect(await ui.find({ key: 'snippets' })).toBeDefined()
  await ui.unmount()
})

test('toggled snippets wrap the message: prepends by order, the text, then appends by order', async ($, on) => {
  engine(on)
  await start($)
  await choose($, ['push.md', 'lean.md', 'diagnose.md', 'orchestrate.md'])

  const sent = await $.prompt.submit(typed('Why does it 404?'))

  expect(sent).toEqual(
    expect.objectContaining({
      text: [
        'You orchestrate.',
        'Keep context lean.',
        'Why does it 404?',
        'Push once.',
        'Do not change code.',
      ].join('\n\n'),
    }),
  )
})

test('pressing a row twice toggles it back off', async ($, on) => {
  engine(on)
  await start($)
  await choose($, ['diagnose.md', 'diagnose.md'])

  const sent = await $.prompt.submit(typed('untouched'))

  expect(sent).toEqual(expect.objectContaining({ text: 'untouched' }))
})

test('toggles reset after a send, so a snippet applies to one message only', async ($, on) => {
  engine(on)
  await start($)
  await choose($, ['diagnose.md'])

  await $.prompt.submit(typed('first'))
  const second = await $.prompt.submit(typed('second'))

  expect(second).toEqual(expect.objectContaining({ text: 'second' }))
})

test('a slash command is sent untouched and keeps the toggles for the next real message', async ($, on) => {
  engine(on)
  await start($)
  await choose($, ['diagnose.md'])

  const command = await $.prompt.submit({
    ...typed('/review-pr 123'),
    command: { name: 'review-pr', args: '123' },
  })
  const message = await $.prompt.submit(typed('Why?'))

  // The engine refuses a rewrite of a slash command line, so none is attempted.
  expect(command).toEqual(expect.objectContaining({ text: '/review-pr 123' }))
  expect(message).toEqual(expect.objectContaining({ text: 'Why?\n\nDo not change code.' }))
})

test('the closed band names the active snippets per placement, on every surface', async ($, on) => {
  engine(on)
  await start($)
  await choose($, ['lean.md', 'push.md'])

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /prepend:/ }))?.text).toBe('↑ prepend: Lean')
    expect((await ui.find({ type: 'Text', text: /append:/ }))?.text).toBe('↓ append: Push')
    await ui.unmount()
  }
})

test('preview shows the body of the focused snippet under the list', async ($, on) => {
  engine(on)
  await start($)
  await pressCtrlE($)
  await focusBand($, 'push.md')

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'preview' })

  expect((await ui.find({ type: 'Text', text: /^Push once\.$/ }))?.text).toBe('Push once.')
  await ui.unmount()
})
