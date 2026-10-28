---
name: implement-with-speech
description: >-
  Implement a LaundryBot GitHub issue exactly as /implement does, with every
  reply read aloud as it lands. Use when asked to implement an issue with
  speech - "/implement-with-speech 12", "work issue 12 out loud".
---

# Implement with speech

## Base

Read
[the general skill](../../att-docs/plugins/general/skills/implement-with-speech/SKILL.md)
first and follow it, except where this file overrides it. The general skill is the
vendored copy pinned by `.claude/att-docs.lock`; never edit it here.

## Paths

| Placeholder | Value here |
| --- | --- |
| `<speech-mechanism>` | The user-scope `voice` plugin's `speak-attention.sh` Stop hook, run with [extension.json](../voice-bridge-hooks/extension.json) |
| `<voice-relay>` | The voice bridge, through the same plugin's `voice_bridge_reply.py` |
| `<reading-rules>` | The general skill's rules, with the spoken terms in [extension.json](../voice-bridge-hooks/extension.json) |

## Overrides

None. The skill this one runs is LaundryBot's
[implement](../implement/SKILL.md), so its overrides apply.

## Added gates

None. Every gate is `/implement`'s.

## Repository notes

- [voice-bridge-hooks](../voice-bridge-hooks/SKILL.md): the hooks and their config.
