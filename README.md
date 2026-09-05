# StudyMate

**AI-Powered Study Assistant** — built with React and Langflow.

StudyMate is a small AI Agent that guides a complete learning loop. You tell it what you want to
learn; it plans the topic, teaches it one step at a time, quizzes you, marks your answers honestly,
and tells you what to study next.

```
Learn  →  Understand  →  Quiz  →  Evaluate  →  Continue
```

---

## Features

- **Learning plan** — a 4–6 step path generated for whatever topic you name
- **Guided teaching** — one concept per reply, with concrete examples and code
- **Quiz generation** — three questions drawn from what you were actually taught
- **Answer evaluation** — honest marking, a score, and an explanation of every mistake
- **Conversational memory** — the agent remembers your topic, step, quiz and answers
- **Graceful failure** — friendly errors and a retry when Langflow or the model is unavailable

---

## Architecture

```
┌──────────────────────────────────────────┐
│                  USER                    │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│         React + Vite Frontend            │
│                                          │
│  Study assistant interface               │
│  Session + conversation state            │
└───────────────────┬──────────────────────┘
                    │
                    │  HTTP  POST /api/v1/run/studymate
                    ▼
┌──────────────────────────────────────────┐
│              LANGFLOW  :7860             │
│                                          │
│   Chat Input → StudyMate Agent → Output  │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│           STUDYMATE AI AGENT             │
│                                          │
│  Understand intent                       │
│         ↓                                │
│  Decide the learning action              │
│         ↓                                │
│  ┌────────┐ ┌───────┐ ┌───────────────┐  │
│  │  PLAN  │ │ TEACH │ │ QUIZ / EVAL   │  │
│  └────────┘ └───────┘ └───────────────┘  │
│         ↓                                │
│        LLM  (Groq / Gemini)              │
└──────────────────────────────────────────┘
```

The AI reasoning lives entirely in Langflow. React is only the user-facing application — it never
talks to a model provider and never holds a provider key.

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Lucide icons |
| Agent orchestration | Langflow 1.12 (Docker) |
| LLM | Groq `openai/gpt-oss-20b` (free tier), Gemini 2.5 Flash as an alternative |
| State | React hooks + `sessionStorage` — no database |

There is no custom backend, no authentication, and no database by design.

---

## Prerequisites

- **Node.js** 18 or newer
- **Docker Desktop**
- A **Groq API key** — free at <https://console.groq.com/keys>
  (or a Google Gemini key from <https://aistudio.google.com/apikey>)

---

## Installation

### 1. Configure the provider key

```bash
cp .env.example .env
```

Then edit `.env` and set your key:

```env
GROQ_API_KEY=gsk_your_key_here
```

This file is read by Docker Compose and stays server-side. It is git-ignored.

### 2. Start Langflow

```bash
docker compose up -d
```

The first run builds a small custom image (stock Langflow 1.12.0 plus `langchain-groq`, which the
official image does not ship). Langflow then takes about a minute on first boot. Check it:

```bash
curl http://localhost:7860/health
```

### 3. Import the StudyMate flow

Open <http://localhost:7860>, then **New Flow → Import** and select:

```
langflow/studymate-flow.json
```

Full walkthrough — including how to build the flow by hand and how to switch to Gemini — is in
[`langflow/README.md`](langflow/README.md).

> ⚠️ Do not open the Agent's **Language Model** dropdown. Groq is missing from Langflow's model
> catalogue, so the UI clears the selection and the flow stops working. See the Groq caveat in
> `langflow/README.md` for why, and how to restore it.

### 4. Configure the frontend

```bash
cd frontend
cp .env.example .env
```

The defaults already work with the imported flow:

```env
VITE_LANGFLOW_BASE_URL=http://localhost:7860
VITE_LANGFLOW_FLOW_ID=studymate
VITE_USE_MOCK_AI=false
```

`studymate` is the flow's endpoint name, set inside `studymate-flow.json`. If you prefer the flow's
UUID, copy it from the Langflow URL (`/flow/<id>`) and use that instead — both work.

### 5. Install and run the frontend

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

---

## Docker commands

```bash
docker compose up -d          # start Langflow (rebuilds if needed)
docker compose down           # stop it
docker compose logs -f        # follow the logs
docker compose up -d --build  # force a rebuild of the image
```

**After changing `.env`, always use `docker compose up -d` — not `docker compose restart`.**
`restart` reuses the container's existing environment and will not pick up a new API key.

`docker compose down -v` also deletes the volume, which removes your imported flows and global
variables.

---

## Demo script

The project is built so this runs smoothly in a few minutes:

1. Open StudyMate and click **“Teach me SQL JOIN”**
2. The agent replies with a learning plan and starts teaching the first concept
3. Ask **“Explain INNER JOIN with an example”** — it answers in context
4. Ask **“Give me a 3-question quiz”**
5. Answer with **“B”** — the agent marks it, scores it, and explains why
6. Ask **“What should I learn next?”**
7. Click **New Session** — the conversation and session ID reset

---

## Why this is an AI Agent, not a chatbot

A chatbot answers the message in front of it. StudyMate runs a loop:

```
Observe    the learner's message
   ↓
Understand the intent behind it (new topic? question? quiz request? an answer?)
   ↓
Decide     which learning action moves them forward
   ↓
Act        plan, teach, quiz or evaluate
   ↓
Evaluate   the learner's response against what it actually taught
   ↓
Continue   from the step it remembers, not from scratch
```

The agent recognises seven intents — `START_LEARNING`, `EXPLAIN_TOPIC`, `ASK_QUESTION`,
`CREATE_QUIZ`, `SUBMIT_ANSWER`, `CONTINUE_LEARNING`, `REQUEST_FEEDBACK` — and maps them onto four
capabilities: `CREATE_LEARNING_PLAN`, `TEACH_TOPIC`, `GENERATE_QUIZ`, `EVALUATE_ANSWER`. It also
keeps state across turns: the current topic, the current step, the last quiz, and your answers.

That decision-and-memory loop is what makes it an agent. The intent table and the four capabilities
are defined in the agent's instructions — see `langflow/README.md`.

---

## Project structure

```
Capstone-Project/
├── frontend/
│   ├── src/
│   │   ├── components/        Header, hero, chat, markdown, loading, error
│   │   ├── hooks/
│   │   │   └── useStudySession.ts    messages, session id, send / retry / reset
│   │   ├── services/
│   │   │   ├── langflow.ts           the only place that talks to Langflow
│   │   │   └── mockAgent.ts          offline development stand-in
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
│
├── langflow/
│   ├── studymate-flow.json    importable flow (Chat Input → Agent → Chat Output)
│   └── README.md              flow setup, system prompt, provider switching
│
├── docker-compose.yml
├── Dockerfile.langflow        stock Langflow + langchain-groq
├── .env.example
└── README.md
```

---

## Development without Langflow

To work on the interface while Langflow is off, set this in `frontend/.env`:

```env
VITE_USE_MOCK_AI=true
```

The app then serves scripted plan / lesson / quiz / evaluation replies from
`src/services/mockAgent.ts`. This is a **development aid only** — the real agent always runs in
Langflow, and the default is `false`.

---

## Security notes

- Provider keys (`GROQ_API_KEY`, `GOOGLE_API_KEY`) live in the root `.env`, are passed to the
  Langflow container, and are exposed to the flow as Langflow global variables. They are never sent
  to the browser and never appear in `VITE_*` variables — anything prefixed `VITE_` is compiled into
  the JavaScript bundle and is public.
- `docker-compose.yml` sets `LANGFLOW_AUTO_LOGIN=true` and `LANGFLOW_SKIP_AUTH_AUTO_LOGIN=true` so
  the local API needs no key. **This is for local development only.**
- For anything beyond localhost: remove those two variables, create a Langflow API key, and put a
  small server-side proxy between the browser and Langflow so the key stays on the server. Calling
  Langflow directly from browser code with an API key would publish that key.
- Both `.env` files are git-ignored. Do not commit them.

---

## Troubleshooting

| What you see | Fix |
| --- | --- |
| “StudyMate couldn't reach the AI service” | `docker compose up -d`, then wait for `curl http://localhost:7860/health` |
| “Flow not found” | The flow is not imported, or `VITE_LANGFLOW_FLOW_ID` is wrong |
| “The AI service returned an error” | Usually a missing or invalid `GROQ_API_KEY` — check `docker compose logs -f` |
| “No model selected” | The Language Model dropdown was opened and cleared — see `langflow/README.md` |
| “That is a Groq key, not a Langflow key” | Provider key was put in `frontend/.env`; it belongs in the root `.env` |
| “Langflow rejected the request” | Auth is enabled; set `VITE_LANGFLOW_API_KEY` or restore the auto-login variables |
| “Rate limit reached” | Groq free-tier limit — wait a few seconds |
| Env changes have no effect | Vite reads `.env` at startup; restart `npm run dev` |
