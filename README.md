# stugorkester

Orchestration system for cabin rental management — see `CLAUDE.md` for
conventions and `docs/orkestreringssystem.md` for the full design notes.

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
