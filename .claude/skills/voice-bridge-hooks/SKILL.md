---
name: voice-bridge-hooks
description: The speech and voice bridge hooks, run from the user-scope voice plugin with LaundryBot's extension.json, which announce what a session needs, read replies aloud for /implement-with-speech, and feed the voice bridge the phone follows. Use when changing LaundryBot's voice values or working out why a session spoke, stayed quiet, or never reached the phone.
---

# Voice bridge hooks

## Base

Read
[the general skill](../../att-docs/plugins/voice/skills/voice-bridge-hooks/SKILL.md)
first and follow it, except where this file overrides it. The general skill is the
vendored copy pinned by `.claude/att-docs.lock`; never edit it here.

## Paths

| Placeholder | Value here |
| --- | --- |
| `<config>` | [extension.json](extension.json): the review label, the ready line, the spoken terms, and the bridge's repository values |
| `<hook-settings>` | The `voice` plugin's `hooks/hooks.json`, installed at user scope. This repository's `.claude/settings.json` registers none of them |
| `<entry-points>` | The plugin's own scripts. LaundryBot keeps no shims |
| `<review-label>` | `Manual Review Needed` |
| `<ready-line>` | `PULL REQUEST <N> IS READY FOR YOUR REVIEW` |
| `<ledger-module>` | None. LaundryBot has no run ledger, so `extension.json` names no ledger values |
| `<bridge>` | The voice plugin's `voice-bridge.mjs`, run from the `~/Code/Overmind` checkout with `--config` naming this repository's `extension.json` |

The plugin runs from the plugin cache, not from `.claude/att-docs`, so a pin move is
followed by `claude plugin update voice@att-docs`.

## Overrides

None.

## Added gates

None.

## Repository notes

- [implement](../implement/SKILL.md), Overrides, Section 9: the ready signal and label.
