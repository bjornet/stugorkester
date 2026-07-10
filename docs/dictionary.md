# Dictionary (Swedish → English)

Canonical mapping of Swedish business terms to the English equivalents used in
code, schema, identifiers, comments, and database. See the language rule in
`CLAUDE.md`.

When a Swedish business term is used in conversation or in a design doc, it must
be translated to its English equivalent before it appears in code, schema, or
database — never transliterated or used as-is. If a new Swedish term shows up
that isn't in the table, pick an English equivalent, add it here in the same
change, and use it consistently.

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

Booking status values (`förfrågan → erbjuden → bekräftad → incheckad →
utcheckad → avslutad`) map to: `inquiry → offered → confirmed → checked_in →
checked_out → completed`.
