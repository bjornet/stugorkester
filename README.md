# Stugorkester

Orchestration system for cabin rental management — see `ROADMAP.md` for what's
next, `CLAUDE.md` for conventions, and `docs/orkestreringssystem.md` for the
full design notes.

## Developing

```sh
bun install
bun run db:push   # create/update the SQLite schema
bun run dev -- --open
```

## Building

```sh
bun run build
bun run preview
```
