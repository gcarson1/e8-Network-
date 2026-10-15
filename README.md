# Network+ Study

A single, self-contained HTML file for CompTIA Network+ (N10-009) study: a timed exam simulator, a practice mode with explanations, flashcards, and 15 interactive labs. No server, no login, no install. Open the file in a browser and it works, offline too.

**The file to share:** [`dist/NetPlus-Study.html`](dist/NetPlus-Study.html)

## What's inside

| Mode | What it does |
| --- | --- |
| Simulated exam | 90 questions / 90 minutes by default (also 45 and 20), drawn by official domain weighting. Timer always visible, flag and jump around, no feedback until you submit. Results show the score, a linear scaled-score estimate, a per-domain breakdown and a review of every question. |
| Practice | Pick domains and a focus (mixed, weakest first, new only, missed). Instant right/wrong plus the full explanation. |
| Flashcards | Question-bank cards plus 80 built-in key terms. "Got it" and "Still learning" feed the same mastery stats. Smart Deck puts your weakest domains first. |
| Labs | Subnetting trainer, CIDR slider, OSI stack builder, port drill, TCP handshake animator, topology visualizer, cables & connectors, network devices, IPv4 vs IPv6, routing table builder, VLAN segmentation, wireless standards, DHCP & DNS, attacks & defenses, troubleshooting. |

During an exam, practice set or deck, the sidebar shows a live bubble grid (one square per question). Otherwise it shows the category mastery panel.

## Saving progress

Nothing is saved automatically. Open **Progress** (top right) to download a small `.json` file and import it next time, on any device. On phones or inside Slack, where downloads can fail, use **Copy as text** and **Paste text instead**.

The file only holds recent results per question (for example `"ex1-q01": "011"`, oldest first) plus a summary of domain percentages. It doesn't store individual exam attempts.

How mastery is calculated: each item scores *correct answers in its last 3 attempts ÷ max(2, attempts)*. Getting a question right twice in a row masters it, and a recent miss pulls it back down. A domain's percentage is the average across all of its questions (unseen questions count as 0), plus any key terms you've studied in that domain.

As a safety net, the app also keeps a copy in the browser's local storage and offers to restore it if you reopen the page without importing. Don't rely on that copy: private windows and in-app browsers often clear it.

## Sharing

- **Desktop:** send `NetPlus-Study.html` as a Slack or email attachment. Recipients download it and double-click to open.
- **Phones:** Slack's mobile app may show an attached `.html` file as source code rather than running it. For mobile, host the file and share a link. Since this is already a GitHub repo, GitHub Pages works: serve `dist/` and link to `NetPlus-Study.html`.

## Updating the question bank

Questions are baked into the HTML at build time from `network_plus_question_bank.csv`.

```bash
npm install
npm run build        # writes dist/NetPlus-Study.html
npm run dev          # live-reload dev server at http://localhost:5173
```

The CSV importer is flexible about format (see `src/lib/bank.js`):

- **Question:** `question`, `prompt` or `stem`
- **Options:** `option_a` … `option_g`, `a` … `h`, `choice_1` …, or a single `options` column split on `|`
- **Correct answer:** letters (`B`, `D|E`, `A, C`), 1-based numbers, or the exact option text
- **Category:** `category`, `domain` or `topic`. Names are matched loosely onto the five N10-009 domains, so "Network Implementation" and "2.0 Network Implementations" both work.
- **Optional:** `id`, `explanation`, `source`, `question_type`

Keep `id` values stable when you edit the CSV, because progress files are keyed by them.

## Project layout

```
network_plus_question_bank.csv   source questions
src/lib/          CSV parsing, bank normalization, mastery math, progress file, IP math
src/modes/        Home, Exam, Practice, Flashcards, Labs screens
src/labs/         the 15 interactive labs (+ kit.jsx: drills, ordering, sequence animator)
src/data/terms.js built-in key-terms flashcard deck
src/styles.css    design system (monochrome; red/green only for right/wrong)
```
