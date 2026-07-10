# Dictionary & language guide

This file is the home for everything about language use in this project: the
conventions that keep our vocabulary consistent (a _ubiquitous language_) and
the canonical Swedish → English translation table. If a question about wording,
naming, or terminology comes up, the answer belongs here.

## Core rule

- Conversation and business discussion with the user happen in **Swedish**.
- **Code, database schema, identifiers, comments, commit messages, and docs in
  this repo are always in English.** The one exception is design notes that
  quote the original discussion (e.g. `docs/orkestreringssystem.md`).
- A Swedish business term must be translated to its English equivalent **before**
  it appears in code, schema, or the database — never transliterated or used
  as-is. Use the [translation table](#translation-table) as the single source of
  truth.

## Ubiquitous language

One concept, one name — used identically in the design docs, the code, the
schema, and the UI-facing English.

- Pick the English term from the translation table and use it everywhere: entity
  names, table names, columns, variables, functions, routes, and docs.
- Don't introduce synonyms. If the table says `Booking`, do not also use
  "reservation" elsewhere for the same concept.
- When the domain gains a new concept, add it to the table in the same change
  that introduces it, then use only that term.
- Keep the two payment states distinct in language as well as in the schema:
  **guest payment** (drives a booking becoming confirmed) vs. **payout** (money
  reaching the owner). Never collapse them into a single word.

## Naming conventions

- **Identifiers** (types, variables, functions): English, `camelCase`; types and
  Drizzle table objects in `camelCase` per the existing schema.
- **Database tables and columns**: English, `snake_case` (e.g. `ledger_entry`,
  `check_in`).
- **Enum / status values**: English, `snake_case` (e.g. `guest_payment`,
  `checked_in`).
- **Files and routes**: English, following SvelteKit conventions.

## Translation table

| Swedish (business term) | English (code/schema term) |
| ----------------------- | -------------------------- |
| Objekt                  | Property                   |
| Kanal                   | Channel                    |
| Bokning                 | Booking                    |
| Betalningspost          | Payment                    |
| Gäst                    | Guest                      |
| Blockering              | Blocking                   |
| Uppgift / ärende        | Task                       |
| Ekonomipost             | LedgerEntry                |
| Kanaladapter            | ChannelAdapter             |
| Skuggbokning            | ShadowBooking              |
| Villkorsbilaga          | TermsAddendum              |
| Städuppgift             | CleaningTask               |
| Städ                    | Cleaning                   |
| Handpenning             | Deposit                    |
| Slutbetalning           | FinalPayment               |
| Utbetalning             | Payout                     |
| Hyresavtal              | RentalAgreement            |
| Bokningsbekräftelse     | BookingConfirmation        |
| Husregler               | HouseRules                 |

### Booking status values

`förfrågan → erbjuden → bekräftad → incheckad → utcheckad → avslutad` map to:
`inquiry → offered → confirmed → checked_in → checked_out → completed`.

## Adding a new term

If a Swedish term shows up that isn't covered here, pick an English equivalent,
add it to the translation table in the same change, and use it consistently from
that point on.
