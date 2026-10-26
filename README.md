<p align="center">
  <img src="docs/assets/u-hackathon-banner.png" alt="U-Hackathon 2026, organised by u-topia" width="100%">
</p>

# BridgeSecur

**Check before you send.** BridgeSecur is a warn-only Web3 transfer safety checker. Before a user sends crypto, it checks the destination address, shows a plain-language verdict with evidence, and lets the user decide. It also ships as a MetaMask Snap that shows the same verdict inside MetaMask's native Send confirmation.

Built for U-Hackathon 2026. Live demo (DEMO risk data, WalletConnect not configured): <https://bridgesecur.vercel.app>

> **Status: UI-first MVP.** All risk data is deterministic **DEMO fixtures**, labelled DEMO everywhere. There is no live sanctions, fraud, or on-chain analysis yet. The product is not a security guarantee and never calls an address "safe" (the best verdict is `NO_KNOWN_RISK`).

Last updated: 2026-10-26.

---

## Problem

Crypto transfers are irreversible. Users lose funds to address poisoning (look-alike addresses), sanctioned or scam recipients, and wrong-network sends. Wallets show a raw hex string and a Confirm button, with no context at the moment of decision.

## Principles

| Principle | What it means in code |
|---|---|
| Warn-only | Never blocks a send, never holds funds. The user can always continue. |
| Non-custodial | Never asks for keys or seed phrases. The wallet signs, MetaMask or the connected wallet owns approval. |
| Honest verdicts | Four verdicts only: `CRITICAL`, `WARNING`, `UNKNOWN`, `NO_KNOWN_RISK`. No "safe" label. `UNKNOWN` is shown as inconclusive. |
| Privacy | Only `chain_id` and `destination` are sent for a check. localStorage keeps only theme and language. An e2e test asserts the destination never reaches storage. |
| No fabricated numbers | No USD values (no price source). Gas fee is estimated from the chain or shown as unavailable. |

---

## Repository layout

```
U-hack/
├── web/                          React web app (12 screens, EN/TH)
├── packages/bridgesecur-snap/    MetaMask Snap (transaction insight)
├── docs/
│   ├── architecture/datasets.md  Dataset notes
│   └── progress/                 Session-by-session work log
├── pic/                          Design references
└── *.pdf / *.docx / *.xlsx       Hackathon brief, guides, design PDF
```

Each package has its own README with commands and limitations:
[`web/README.md`](web/README.md) · [`packages/bridgesecur-snap/README.md`](packages/bridgesecur-snap/README.md)

---

## Tech stack

### Web app (`web/`)

| Layer | Choice |
|---|---|
| Framework | React 18.3, TypeScript 5.9 (strict), Vite 7 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4, Radix UI primitives, class-variance-authority, tailwind-merge |
| Motion | Framer Motion 12, Sonner toasts, lucide-react icons |
| Wallet | Reown AppKit 1.8 + wagmi 2 + viem 2 (injected wallets, WalletConnect) |
| Data / state | TanStack Query 5, in-memory session context, zod schemas |
| i18n | i18next + react-i18next (English, Thai) |
| Chains | Ethereum, Avalanche (mainnets are check-only); Sepolia and Fuji testnets can send |
| Unit / component tests | Vitest 5, Testing Library, jsdom |
| E2E / accessibility | Playwright (local Chrome, mocked wallet and RPC), axe-core, six viewport sizes |
| Quality | ESLint 9, typescript-eslint, `tsc -b` strict |

### MetaMask Snap (`packages/bridgesecur-snap/`)

| Layer | Choice |
|---|---|
| Runtime | MetaMask Snaps, platform 12.1.0, `@metamask/snaps-sdk` 12.1.0 |
| Tooling | `@metamask/snaps-cli` 8.4.1 (`mm-snap build / serve`) |
| UI | Snap JSX components (`Banner`, `Row`, `Section`, SVG images), interactive interfaces |
| Permissions | `endowment:transaction-insight`, `snap_dialog` (no network access) |
| Language / tests | TypeScript 5.9, Vitest 5, plus a bundle smoke test that evaluates the built bundle in an isolated VM |

### Planned backend contract

The web app speaks to `POST /v1/check` (zod-validated response, 10 s timeout, one retry, abortable) when `VITE_API_URL` is set. Without it, the app uses DEMO fixtures. The backend service is not part of this repository yet.

---

## System architecture

```mermaid
flowchart LR
    User([User])

    subgraph Browser["Browser"]
        Web["BridgeSecur Web App\nReact + Vite"]
        Wallet["Wallet\nMetaMask / WalletConnect / Core"]
    end

    subgraph MM["MetaMask"]
        Send["Native Send confirmation"]
        Snap["BridgeSecur Snap\nonTransaction + onUserInput"]
    end

    subgraph Risk["Risk data"]
        Fixtures[("DEMO fixtures\nweb/src/fixtures/demo.ts")]
        MockP["MockRiskProvider\nsnap/src/risk"]
        API["Risk API\nPOST /v1/check\n(planned)"]
    end

    Chain[("Blockchain\nSepolia / Fuji RPC")]

    User --> Web
    User --> Send
    Web -- "chain_id + destination" --> Fixtures
    Web -. "when VITE_API_URL set" .-> API
    Web -- "connect, send" --> Wallet
    Wallet -- "eth_sendTransaction" --> Chain
    Web -- "receipt polling" --> Chain
    Send -- "onTransaction" --> Snap
    Snap --> MockP
    MockP -. "future HttpRiskProvider" .-> API
    Snap -- "verdict panel" --> Send
```

The web app and the Snap are independent. The website's check and send flow does not need the Snap. Installing the Snap does not open the website's risk popup. Both read the same verdict model, from separate fixture sets.

---

## Flow 1: Web app transfer flow

```mermaid
flowchart TD
    A([Landing /]) --> B[Connect wallet\nReown AppKit]
    B --> C[Send /send\nchoose chain, destination, amount]
    C --> D{Address valid?\nviem isAddress}
    D -- no --> C
    D -- yes --> E[Address checking overlay]
    E --> F{Verdict}
    F -- CRITICAL --> G1[Pre-send alert sheet\nacknowledgement checkbox required]
    F -- WARNING --> G2[Pre-send alert sheet]
    F -- UNKNOWN --> G3[Inconclusive notice]
    F -- NO_KNOWN_RISK --> G4[Result card, not a safety claim]
    G1 --> H[Analysis chat /analysis/:id]
    G2 --> H
    G3 --> H
    G4 --> I
    H --> H2[Risk details /analysis/:id/details]
    H --> H3[BridgeConsult /consult\nevidence-grounded templated answers]
    H --> I
    H2 --> I
    I[Transaction review /review\nfull address + network] --> J{User continues?}
    J -- no --> C
    J -- yes --> K[Wallet approval\nMetaMask or connected wallet]
    K --> L[Transaction progress /transaction/:id]
    L --> M([Receipt result])
    C -. "any change to destination or chain invalidates the check" .-> E
```

Notes:
- The check is invalidated when the destination or chain changes, and stale responses are discarded (`src/state/session.tsx`).
- Acknowledgements are tracked per check, not globally.
- BridgeConsult has no LLM. It composes answers from the check's evidence and labels each as fact, general guidance, or cannot verify.
- History is in-memory and clears on refresh.

## Flow 2: Transaction lifecycle (state machine)

Implemented in `web/src/lib/txMachine.ts`. A state is entered only after the previous operation succeeded. Confirmation requires a successful receipt, never just a broadcast.

```mermaid
stateDiagram-v2
    [*] --> preparing: user continues
    preparing --> awaiting_approval: balance, gas, network OK
    preparing --> failed: invalid input / wrong network / insufficient funds
    awaiting_approval --> broadcasting: wallet returns hash
    awaiting_approval --> rejected: user rejects in wallet
    broadcasting --> pending_confirmation: node knows the tx
    broadcasting --> confirmation_unknown: not seen before timeout
    pending_confirmation --> confirmed: receipt status success
    pending_confirmation --> failed: receipt reverted
    pending_confirmation --> replaced: speed-up or cancel
    pending_confirmation --> confirmation_unknown: receipt timeout
    confirmed --> [*]
    rejected --> [*]
    failed --> [*]
    replaced --> [*]
    confirmation_unknown --> [*]
```

Timeouts: prepare 20 s, broadcast 30 s (poll every 2 s), receipt 180 s. Duplicate submissions are guarded in `useTransfer`.

## Flow 3: MetaMask Snap flow

```mermaid
sequenceDiagram
    actor U as User
    participant MM as MetaMask Send
    participant S as Snap onTransaction
    participant P as RiskProvider (Mock)
    participant UI as Interactive interface

    U->>MM: Enter recipient, continue to confirmation
    MM->>S: onTransaction(transaction, chainId)
    S->>P: analyze(recipient, chainId)
    alt provider throws or returns invalid data
        P-->>S: error
        S->>S: build UNKNOWN (inconclusive) result
    else ok
        P-->>S: RiskResult (verdict, score?, evidence)
    end
    S->>UI: snap_createInterface(context per transaction)
    alt interface created
        S-->>MM: { id } (+ severity Critical if CRITICAL)
    else older client or failure
        S-->>MM: { content: static report } (+ critical dialog)
    end
    MM-->>U: Insights tab: warning view
    U->>UI: tap Analysis / Risk details / ask a question
    UI->>S: onUserInput(event, context)
    S-->>UI: update view (navigation only)
    U->>MM: Confirm or Cancel (MetaMask owns approval)
```

Snap views: **Warning** (verdict first), **Analysis** (bounded templated Q&A), **Risk details** (provider-score SVG gauge). Each confirmation keeps its own JSON context, so there is no global selected transaction. Snap navigation never approves or cancels a transaction. If the provider fails, the result is `UNKNOWN`, so MetaMask never shows an empty insight because of a Snap error.

## Flow 4: Risk verdict decision

```mermaid
flowchart TD
    In[chain_id + destination] --> N[Normalize: lowercase]
    N --> Sup{Supported chain?}
    Sup -- no --> UNK[UNKNOWN\ninconclusive]
    Sup -- yes --> M{Match DEMO fixture}
    M -- 0xdead... --> CR[CRITICAL\nscore 92]
    M -- 0xbeef... --> WA[WARNING\nscore 64]
    M -- 0x5afe... --> OK[NO_KNOWN_RISK\nno score]
    M -- poisoning pattern --> PO[Look-alike address compare]
    M -- other --> UNK
```

---

## Quick start

### Web app

```bash
cd web
npm install
cp .env.example .env     # set VITE_REOWN_PROJECT_ID (https://cloud.reown.com); VITE_API_URL optional
npm run dev              # http://localhost:5173
```

### Snap

```bash
cd packages/bridgesecur-snap
npm install
npm run build
npm run serve            # http://localhost:8080 (leave running)
```

Then open the web app, go to **Settings**, and click **Install BridgeSecur Snap**. Stable MetaMask may refuse local Snaps; use MetaMask Flask. The Snap id defaults to `local:http://localhost:8080` and can be changed with `VITE_BRIDGESECUR_SNAP_ID`.

### Tests

```bash
# web
npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e
# snap
npm run typecheck && npm test
```

### DEMO addresses

| Verdict | Snap address | Score |
|---|---|---|
| CRITICAL | `0xdead000000000000000000000000000000000001` | 92 |
| WARNING | `0xbeef000000000000000000000000000000000002` | 64 |
| NO_KNOWN_RISK | `0x5afe000000000000000000000000000000000003` | none |
| UNKNOWN | any other address or unsupported chain | none |

Web DEMO endings: addresses ending `dead` give CRITICAL, `beef` WARNING, `0000` UNKNOWN, anything else NO_KNOWN_RISK. Address poisoning demo: `0x1a2b000000000000000000000000000000003c4d`.

---

## What is real vs DEMO

| Feature | Status |
|---|---|
| Risk verdicts | DEMO fixtures. Not live evidence. |
| Wallet connect | Injected wallets via wagmi; WalletConnect needs a Reown project id. Not verified with a real wallet. |
| Testnet send (Sepolia, Fuji) | Implemented with receipt monitoring. Verified only with mocked wallet and RPC. |
| Mainnet | Check-only. |
| BridgeConsult | Templated answers from evidence. No LLM. |
| Snap in real MetaMask | Unit tests, SDK JSX validation and a bundle smoke test pass. Visual check in a live MetaMask/Flask session has not been performed. |

## Known limitations

- Real-wallet and real-testnet transfers are unverified. Screenshots under `web/screenshots/nkr/` use mocked wallet and receipts.
- Main JS chunk is about 2 MB (AppKit), not code-split yet.
- Snap cannot reuse the website's bottom-sheet CSS; MetaMask controls the native layout.
- Snap `snap.manifest.json` shasum changes with every bundle build. Publishing to npm needs the owner's explicit approval.
- Failed-API e2e is not covered (the client's timeout, network, schema and retry paths are unit tested).

## Roadmap

1. `HttpRiskProvider` for the Snap (needs `endowment:network-access`) and a real `/v1/check` backend.
2. Real data sources: sanctions lists, scam-address feeds, on-chain heuristics, address-poisoning detection from the user's own history.
3. Signature insights (`onSignature`) in the Snap.
4. Real-wallet testnet verification and live Flask visual check.
5. Code-split the web bundle.

## Compliance notes

Designed with Thai PDPA in mind: minimal data sent (chain id and destination only), no persistence of addresses, no account or key collection. Any future backend must add a retention policy, audit log, and legal review before handling real risk data.

## Education & achievements

**Learn. Build. Go further.**

Builder: Nattakamon Jaimetha. Source: [portfolio](https://nattakamon-portfolio.vercel.app/).

**Education**

- King Mongkut's Institute of Technology Ladkrabang (KMITL), B.Sc. Data Science & Business Analytics, Data Engineering track (started 2022).
- Coursework: big data systems, data pipelines, applied machine learning, cloud infrastructure, SQL databases, IT project management.
- Senior project: Document Intelligence, an OCR project (academic, 2025).

**Achievements**

| Year | Event | Result |
|---|---|---|
| 2026 | U-Hackathon 2026 | BridgeSecur, a warn-only Web3 transfer safety checker with a MetaMask Snap (this repository). Participant; no result announced. |
| 2026 | SKY Innovation Spark 2026 (SKY ICT hackathon) | One TrustX, an airport decision-support MVP. Selected among 15 teams; advanced to the round of 5 finalists. Final awards not yet decided. |
| 2026 | Super AI Engineer Season 6 (AIEAT Thailand) | FahMai, a Thai-language retrieval project. Benchmark: 95/100 questions across a 118-document knowledge base. |
| 2025 | Super AI Engineer Season 5 (AIEAT Thailand) | Honorable Mention, Healthcare AI project (เฒ่าทัน). |
| 2019 | National Arts & Crafts Competition | Gold Medal, motion infographic "Preserving Thai Seas". |

## Skills & capabilities

Technologies used across my projects. The stack used in this repository is in [Tech stack](#tech-stack). Source: [portfolio](https://nattakamon-portfolio.vercel.app/). Governance frameworks listed are project research, not professional certifications.

**Generative AI & Agents**

<p>
<img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain">
<img src="https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langgraph&logoColor=white" alt="LangGraph">
<img src="https://img.shields.io/badge/RAG-444?style=for-the-badge" alt="RAG">
<img src="https://img.shields.io/badge/LLMs-444?style=for-the-badge" alt="LLMs">
<img src="https://img.shields.io/badge/Agentic%20AI-444?style=for-the-badge" alt="Agentic AI">
<img src="https://img.shields.io/badge/NLP-444?style=for-the-badge" alt="NLP">
<img src="https://img.shields.io/badge/Prompt%20Engineering-444?style=for-the-badge" alt="Prompt Engineering">
<img src="https://img.shields.io/badge/Typhoon%20LLM-444?style=for-the-badge" alt="Typhoon LLM">
<img src="https://img.shields.io/badge/Anti--Hallucination%20Design-444?style=for-the-badge" alt="Anti-Hallucination Design">
</p>

**Machine Learning & Vision**

<p>
<img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch">
<img src="https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="scikit-learn">
<img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV">
<img src="https://img.shields.io/badge/YOLO-00FFFF?style=for-the-badge" alt="YOLO">
<img src="https://img.shields.io/badge/ResNet-444?style=for-the-badge" alt="ResNet">
<img src="https://img.shields.io/badge/OCR-444?style=for-the-badge" alt="OCR">
<img src="https://img.shields.io/badge/Whisper%20STT-444?style=for-the-badge" alt="Whisper STT">
</p>

**Backend & APIs**

<p>
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
<img src="https://img.shields.io/badge/Django%20%2F%20DRF-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django / DRF">
<img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
<img src="https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic">
<img src="https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/REST%20%2F%20NDJSON%20streaming-444?style=for-the-badge" alt="REST / NDJSON streaming">
</p>

**Frontend & Interfaces**

<p>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=white" alt="JavaScript">
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=white" alt="React">
<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
<img src="https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" alt="Vue.js">
<img src="https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white" alt="Streamlit">
<img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui">
<img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
<img src="https://img.shields.io/badge/Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Motion">
<img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js">
<img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma">
</p>

**Data & Analytics**

<p>
<img src="https://img.shields.io/badge/SQL-444?style=for-the-badge" alt="SQL">
<img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" alt="Pandas">
<img src="https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white" alt="NumPy">
<img src="https://img.shields.io/badge/SciPy-8CAAE6?style=for-the-badge&logo=scipy&logoColor=white" alt="SciPy">
<img src="https://img.shields.io/badge/NetworkX-444?style=for-the-badge" alt="NetworkX">
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
<img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
<img src="https://img.shields.io/badge/Tableau-E97627?style=for-the-badge" alt="Tableau">
<img src="https://img.shields.io/badge/Power%20BI-F2C811?style=for-the-badge" alt="Power BI">
<img src="https://img.shields.io/badge/Excel-217346?style=for-the-badge" alt="Excel">
<img src="https://img.shields.io/badge/ETL%20%2F%20data%20pipelines-444?style=for-the-badge" alt="ETL / data pipelines">
</p>

**Cloud & DevOps**

<p>
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
<img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx">
<img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" alt="Git">
<img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions">
<img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
<img src="https://img.shields.io/badge/GCP%20Cloud%20Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="GCP Cloud Run">
<img src="https://img.shields.io/badge/AWS%20SES-FF9900?style=for-the-badge" alt="AWS SES">
<img src="https://img.shields.io/badge/OpenTelemetry-425CC7?style=for-the-badge&logo=opentelemetry&logoColor=white" alt="OpenTelemetry">
<img src="https://img.shields.io/badge/Kubernetes%20%28concepts%29-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" alt="Kubernetes (concepts)">
</p>

**Testing & Evaluation**

<p>
<img src="https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white" alt="Pytest">
<img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge" alt="Playwright">
<img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest">
<img src="https://img.shields.io/badge/Hallucination%20evaluation-444?style=for-the-badge" alt="Hallucination evaluation">
<img src="https://img.shields.io/badge/Human--in--the--loop-444?style=for-the-badge" alt="Human-in-the-loop">
</p>

**AI Governance & Safety**

<p>
<img src="https://img.shields.io/badge/Thai%20PDPA-444?style=for-the-badge" alt="Thai PDPA">
<img src="https://img.shields.io/badge/EU%20AI%20Act-444?style=for-the-badge" alt="EU AI Act">
<img src="https://img.shields.io/badge/NIST%20AI%20RMF-444?style=for-the-badge" alt="NIST AI RMF">
<img src="https://img.shields.io/badge/ISO%2FIEC%2042001-444?style=for-the-badge" alt="ISO/IEC 42001">
<img src="https://img.shields.io/badge/OWASP%20LLM%20Top%2010-444?style=for-the-badge" alt="OWASP LLM Top 10">
<img src="https://img.shields.io/badge/MITRE%20ATLAS-444?style=for-the-badge" alt="MITRE ATLAS">
</p>

## Documentation

Session-by-session decisions and verification notes live in [`docs/progress/`](docs/progress/).
