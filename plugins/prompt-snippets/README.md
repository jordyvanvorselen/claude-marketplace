# Prompt Snippets

Mix-and-match single-purpose prompt rules that are prepended or appended to
your next message when you send it. Unlike skills, each snippet is a tiny,
standalone instruction: toggle exactly the ones you want per message.

A Claude Code port of the Pi `prompt-snippets` extension. It is a Claude Code
mod (a hooks module), so it rewrites the text you send, as Pi does.

## Install

```
/plugin install prompt-snippets --marketplace jordyvanvorselen/claude-marketplace
```

Then add the keybindings below.

## Usage

The menu lives in the band directly above the prompt, without a frame.

| Key | What it does |
|---|---|
| ctrl+e | Open the menu; press it again to close it |
| j / k (or down / up) | Move between snippets |
| space | Toggle the snippet under the cursor |
| p | Preview the snippet under the cursor (name, placement, order, file, body) |
| esc | Hand the keyboard back to the prompt; the menu stays open, ctrl+e re-enters it |

`/snippets` opens or closes the menu as well.

- Toggles apply as you make them. Toggling a snippet off again is the undo.
- When the menu is closed, the band names the active snippets:
  - `↑ prepend: ...` is inserted before your message
  - `↓ append: ...` is inserted after your message
- When you send a message, the active snippet bodies are merged into its text:
  prepend group (sorted by `order`), then your text, then append group (sorted
  by `order`), separated by blank lines. Sending also closes the menu.
- Toggles reset to all off after each send and at session start. A slash
  command is sent untouched and keeps the toggles for your next message.

## Keybindings

A Claude Code mod cannot register keys of its own, so the shortcuts are
keybindings in `~/.claude/keybindings.json`:

```json
{
  "$schema": "https://www.schemastore.org/claude-code-keybindings.json",
  "bindings": [
    {
      "context": "Chat",
      "bindings": { "ctrl+e": "abovePrompt:focus" }
    },
    {
      "context": "AbovePrompt",
      "bindings": {
        "ctrl+e": "pane:next",
        "j": "abovePrompt:next",
        "k": "abovePrompt:previous",
        "down": "abovePrompt:next",
        "up": "abovePrompt:previous"
      }
    }
  ]
}
```

- `abovePrompt:focus` gives the band the keyboard; the menu opens when the focus lands on it.
- `pane:next` is only handled by Claude Code while a pane has the keyboard, so in
  the band it reaches the menu's buttons, which borrow it to toggle the menu.
- ctrl+e in the prompt replaces its usual "move to end of line". It also works
  in vim normal mode.
- j, k and the arrows move between the items of every plugin's band, instead
  of scrolling it.
- Enter and Esc in the band are Claude Code's own and cannot be rebound.

## Snippet files

Snippets live in `snippets/` in this plugin, one markdown file each, with
frontmatter:

```markdown
---
name: Concise
description: Keep answers short and to the point
placement: prepend
order: 10
---
Keep your response concise. Skip preamble and unnecessary explanation.
```

| Field | Required | Notes |
|---|---|---|
| `name` | no | Display name; defaults to the filename without `.md` |
| `description` | no | Shown next to the name in the menu |
| `placement` | no | `prepend` or `append` (default: `append`) |
| `order` | no | Number; sorts snippets within their group, in the menu and in the applied text (default: `9999`, ties broken by name) |

The folder is re-read every time the menu opens and every time a message is
sent, so edits to a plugin read from a local folder take effect immediately.

## Developing

```
claude --plugin-dir plugins/prompt-snippets   # hot-reloads on save
claude plugin validate plugins/prompt-snippets
claude plugin test plugins/prompt-snippets
```
