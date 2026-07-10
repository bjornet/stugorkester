# Stuguthyrning – orkestreringssystem: Take aways

Sammanställning från diskussion 2026-07-10. Underlag för implementation i projektet.

---

## 1. Grundidé & motivering

- Plattformar (Airbnb, Stugknuten m.fl.) är silos med admin-UI som inte ger sökbarhet/överblick, och de täcker inte behov som städhantering.
- **Bygg ett eget system som source of truth** för stugan (bokningar, städ, underhåll, gäster, priser). Plattformarna blir "outputs"/speglingar – aldrig master.

---

## 2. Kanalfakta (verifierat via research)

### Airbnb (standard-host)

- **Ingen publik API.** API kräver "Preferred Software Partner"-status (mjukvaruföretag, inte enskilda hosts). Skrapning/inofficiella API:er bryter mot villkoren → risk för avstängning. PMS-kopplade listningar tvingas dessutom ha Instant Booking.
- **iCal är enda integrationsytan:**
  - _Export (Airbnb → mig):_ .ics-URL per listning. Jag pollar själv → kan vara nära realtid. Innehåll: endast upptagna datumintervall (ingen gästdata, inga priser). Känd bugg: feeden visar bara ~365 dagar framåt; längre bokningar får fel slutdatum tills tiden hinner ikapp.
  - _Import (mitt system → Airbnb):_ Airbnb pollar min feed **varannan timme** (ej ändringsbart; manuell trigger finns men begränsat antal ggr). Importerar upp till 2 års data.
- **Dubbelbokningsfönster på några timmar är oundvikligt** → konfliktdetektering + larm krävs, synken får aldrig antas vattentät.
- **Rik data (gäst, pris) måste in separat:** manuell komplettering av "skuggbokningar", ev. mejlparsning senare.
- **Övervaka feed-hälsa:** trasig iCal-URL är vanligaste tysta felet → larm om feed ej hämtningsbar på X timmar.
- **Avgifter:** split-modellen (~3 % värd) fasas ut land för land under 2026 och ersätts av en enda värdavgift ~15,5 %. Sverige verkar inte omställt ännu men det är sannolikt på väg → **räkna med ~15 % i kalkyler framåt.**

### Stugknuten

- Marknadsplats med bokningstjänst. **12 % provision per bokning**, ingen startavgift.
- Flöde: gäst kontaktar via meddelandetjänst → jag skickar **bokningserbjudande** (datum, totalhyra, avbokningspolicy) → gästen accepterar genom att **betala hela hyran med kort direkt** (via MangoPay) → **utbetalning till mig minus 12 % tidigast vid utcheckning**, och endast om gästen inte anmält krav om bristande avtalsuppfyllnad.
- Ingen handpenningsrutin behövs – gästbetalning sker i förväg i deras flöde.
- **Avtal:** bokningserbjudandet täcker kärnan (period, pris, betalning, avbokning). Täcker INTE husregler, skadeansvar, max antal personer, husdjur, rökning, städkrav → **egen villkorsbilaga behövs** (kan skickas som eget dokument vid bokning).
- **Försäkring ingår** (Omocom): plötsliga/oförutsedda skador som hemförsäkringen inte täcker. Kräver grundförsäkring i botten. Självrisk 1 000 kr (betalas av uthyraren).
- **Städ stöds inte i deras system** – hanteras vid sidan av bokningen. Går att lösa genom att baka in städ i hyran (se §4).
- Gör aldrig upp betalning utanför deras flöde (tappar betalskydd + försäkring; de skannar dessutom meddelanden efter otillåtna betalningsförslag).
- Ingen iCal/maskinläsbar synk → manuell kanal.

### Stugnet

- Ren **annonssajt, gratis**, inga förbindelser. Ingen bokningsmotor, betalning, kalender eller försäkring – allt är mitt ansvar.
- Förtroendeproblem hos gäster (Swish-handpenning till främling) → professionellt flöde krävs: skriftligt hyresavtal, bokningsbekräftelse, kvitto på handpenning. **Detta genererar mitt system.**
- Ingen integration alls → manuell kanal (annons-uppdateringspåminnelser).

### Övriga

- **Fritiden.se:** annonssajt, 380 kr/år, 0 % provision, egen betalning (Swish/bank). Samma "allt själv"-profil som Stugnet.
- **Booking.com:** 15–20 % provision, iCal-stöd, internationell räckvidd.
- **Stugsommar/Novasol/DanCenter:** fullservice-förmedlare, 10–40 % provision, sköter allt – men **risk för exklusivitetskrav som blockerar multi-kanal-upplägget**. Ej aktuell för detta projekt.

### Skatt (alla kanaler)

- Schablonavdrag 40 000 kr + 20 % av hyresintäkten → i praktiken ~50 000 kr/år skattefritt. Överskott beskattas 30 % (inkomst av kapital).
- Inbakat städ räknas som hyresintäkt (inga extra avdrag för faktisk städkostnad vid privatuthyrning) – oftast okej, men medvetet val.
- **Systemet ska kunna summera årets intäkter per kanal som deklarationsunderlag.**

---

## 3. Beslut: städ

- **Baka in städ i priset** (eller obligatoriskt tillägg angivet i annons) och låt det gå genom kanalens betalflöde. Enkelhet > att spara provisionen (12 % på 800 kr = 96 kr).
- Skriv alltid tydligt i annons OCH villkorsbilaga: "Slutstädning ingår" alt. "Obligatorisk slutstädning X kr tillkommer". Otydligt städ är en klassisk tvistekälla.
- Prissättning i systemet modelleras som **hyra + inbakade komponenter** (städ, el, sängkläder …) → systemet kan räkna fram gästpris, provision och faktiskt netto per bokning.

---

## 4. Arkitektur

### 4.1 Datamodell (kärnentiteter)

| Entitet            | Nyckelinnehåll                                                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objekt**         | Beskrivning, bilder, faciliteter, husregler. Byggs för flera objekt även om det bara finns ett nu.                                                                                                                                                                                                |
| **Kanal**          | Namn + kapabilitetsattribut: betalning (ja/nej), avtal (helt/delvis/inget), försäkring, städhantering, synk-typ (iCal/manuell), provisionsmodell. Styr vilka dokument/uppgifter systemet måste generera per bokning.                                                                              |
| **Bokning**        | Datum, kanal, status (förfrågan → erbjuden → bekräftad → incheckad → utcheckad → avslutad), gäst, prisuppdelning, avbokningspolicy.                                                                                                                                                               |
| **Betalningspost** | 1–n per bokning. Typ (gästbetalning / utbetalning-till-mig), belopp, förfallodatum, status. Viktigt: gästens betalning (styr "bekräftad") och min utbetalning (t.ex. Stugknuten: efter utcheckning) är **separata tillstånd**. Möjliggör larm som "utbetalning saknas X dagar efter utcheckning". |
| **Gäst**           | Fristående från bokning → återkommande gäster syns oavsett kanal.                                                                                                                                                                                                                                 |
| **Blockering**     | Egna vistelser, underhåll. Samma kalenderlogik som bokning, utan gäst.                                                                                                                                                                                                                            |
| **Uppgift/ärende** | Städ, tillsyn, underhåll, "uppdatera annons på X". Kopplas till bokning eller objekt.                                                                                                                                                                                                             |
| **Ekonomipost**    | Intäkt, provision, netto per bokning → deklarationsunderlag mot 50 000 kr-gränsen.                                                                                                                                                                                                                |

### 4.2 Kalendermotor (hjärtat)

- Funktion: "är intervall X–Y ledigt?" över bokningar + blockeringar; larm vid överlapp.
- **iCal-export:** en feed som Airbnb m.fl. prenumererar på. Måste vara internet-nåbar 24/7.
- **iCal-import:** pollar Airbnbs feed tätt (~var 15:e min) → skapar skuggbokningar som kompletteras manuellt med gästdata.
- **Konfliktdetektering med larm** (mejl/push) – obligatorisk pga 2 h-synkfönstret.
- Feed-hälsoövervakning (larm om feed ej hämtad på X h).

### 4.3 Kanaladaptrar

- **Synkade** (Airbnb, ev. Booking): automatisk iCal in/ut + regler för skuggbokningskomplettering.
- **Manuella** (Stugknuten, Stugnet, Fritiden): checklistor + påminnelser; människan är transportlagret men allt registreras i systemet. Ex: "Ny Stugknuten-bokning → registrera → skicka villkorsbilaga → (Airbnb blockeras automatiskt via feed)". Prisändring → påminnelse att uppdatera annonser.

### 4.4 Dokumentgenerator

- Mallar + bokningsdata → PDF/dokument. Kanalens kapabilitetsattribut avgör behovet:
  - **Stugknuten:** villkorsbilaga/husregler + städinfo.
  - **Stugnet/direkt:** komplett hyresavtal + bokningsbekräftelse + kvitto (handpenning/slutbetalning).
  - **Alla:** incheckningsinfo, städinstruktion.

### 4.5 Städ- & uppgiftsflöde

- Regelstyrt: bokning bekräftas → städuppgift skapas automatiskt med deadline = nästa incheckning. Utcheckning flyttas → uppgiften flyttas + notis till städare.
- Återkommande underhåll (sotning, vattenavstängning m.m.) som schemalagda uppgifter.

### 4.6 Gränssnitt (v1)

- Webbapp (mobilvänlig): kalendervy, bokningslista, att göra-lista, ekonomiöversikt. Sökbarheten kommer "gratis" när datat ligger i egen databas.

### 4.7 Flödesexempel: Stugknuten-bokning

1. Förfrågan via Stugknutens meddelanden → registreras (status: förfrågan)
2. Systemet verifierar lediga datum, räknar pris inkl. städ + netto efter 12 %
3. Bokningserbjudande skickas i Stugknuten; gäst betalar → status bekräftad
4. Automatiskt: datum blockeras → Airbnb-feed uppdateras → villkorsbilaga genereras → städuppgift skapas → ekonomipost bokförs
5. Efter utcheckning: påminnelse kontrollera städ + bocka av Stugknuten-utbetalning

### 4.8 Avgränsningar v1 (kan byggas på senare utan arkitekturändring)

- Ingen egen bokningssajt mot gäster
- Ingen automatisk prissättning
- Ingen mejlparsning av Airbnb-notiser

---

## 5. Teknikstack

- **Frontend + stomme: SvelteKit** (adapter-node, ej serverless). Form actions för admin-CRUD, `+server.ts`-endpoints för iCal-feeden, SSR.
- **Databas: SQLite** via **Drizzle**. En fil, noll drift, trivial backup. Postgres är overkill för enanvändarsystem.
- **Bakgrundsjobb:** separat liten worker-process (samma kodbas, delar databasmodul) för iCal-polling, påminnelser, konfliktlarm. (Alternativ: cron-loop i `hooks.server.ts` – funkar men mindre rent.)
- **Effect** – avgränsat till **sync/jobb-modulen** (workern), inte hela backend:
  - Hemmaplan: hämta feed → parsa → diffa → skuggbokningar → larm, med typade fel, retries/backoff, timeouts, `Effect.repeat` + `Schedule`.
  - `@effect/schema` för validering av parsad iCal-data (bra första Effect-övning).
  - CRUD-delarna hålls som enkel SvelteKit-kod. Smalt gränssnitt: worker skriver till SQLite, SvelteKit läser.
- **Kalendervy:** FullCalendar.
- **iCal:** `ical-generator` (export), `node-ical` (parsning) – ev. parsning som Effect-pipeline.
- **PDF:** HTML-mallar → PDF (Puppeteer eller pdfkit).
- **Notiser:** mejl först (Nodemailer + SMTP); push/SMS senare.
- **Drift:** liten VPS/PaaS (Hetzner, Fly.io, Railway) eftersom iCal-exporten kräver 24/7-nåbarhet. Alternativ: hemmaserver + Cloudflare Tunnel. Rekommendation: VPS.
- **Designprincip: "tråkig teknik"** – en process (+ worker), en SQLite-fil, inga microservices. Värdet ligger i datamodellen och flödena.

---

## 6. Öppna frågor / nästa steg

- Detaljera tabellschema (fält, relationer, index) utifrån §4.1
- Definiera kanalernas kapabilitetsattribut som seed-data (Airbnb, Stugknuten, Stugnet, ev. Fritiden/Booking)
- Skriva villkorsbilaga-mall (husregler, skadeansvar, max personer, husdjur, rökning, städkrav)
- Bevaka när Airbnbs 15,5 %-värdavgift når Sverige (mejl/Resource Center ~2 mån innan deadline) → justera priser med ~18,34 % markup vid övergång
- Besluta polling-intervall och larmtrösklar (feed-hälsa, utbetalningspåminnelse)
- Städupplägg: bekräfta pris för inbakad slutstädning och uppdatera annonstexter på alla kanaler
