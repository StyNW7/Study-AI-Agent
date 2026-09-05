# StudyMate Flow — Langflow Setup

The StudyMate agent lives here. `studymate-flow.json` is an exportable, version-controlled
Langflow flow, tested against **Langflow 1.12.0** (the version pinned in `docker-compose.yml`).

---

## The flow

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│   Chat Input    │─────▶│   StudyMate Agent    │─────▶│   Chat Output   │
│ "Student        │      │                      │      │ "StudyMate      │
│  Message"       │      │  Agent Instructions  │      │  Reply"         │
└─────────────────┘      │  Groq / gpt-oss-20b  │      └─────────────────┘
                         │  24-message memory   │
                         └──────────────────────┘
```

Three components. That is deliberate — the agent behaviour comes from its instructions and its
conversation memory, not from a large graph. Langflow's `Agent` component already provides the
agent loop (intent handling, memory, and tool calling when tools are attached).

### Where the four "tools" are

The capstone brief describes four tools: `create_learning_plan`, `teach_topic`, `generate_quiz`,
`evaluate_answer`. In this flow they are **defined as capabilities inside the agent's
instructions**, each with its own inputs and required output format, and the agent selects between
them based on the intent it detects in your message.

This was a deliberate choice over four custom Python components: it keeps the graph readable,
removes a whole class of setup failures, and the agent's decision-making — the thing a capstone
needs to demonstrate — is identical either way. If you later want them as literal Langflow tools,
attach components to the Agent's **Tools** input; the agent will call them without any other change.

---

## Import it (recommended)

1. Start Langflow: `docker compose up -d` from the project root
2. Open <http://localhost:7860>
3. **New Flow → Import**, and choose `langflow/studymate-flow.json`
4. Open the flow and confirm the **StudyMate Agent** shows Groq / `openai/gpt-oss-20b`

The flow ships with `endpoint_name: studymate`, so it is callable at
`POST /api/v1/run/studymate` immediately — no ID to copy. Its UUID
(`b7f1c2d4-3a56-4e18-9c0b-5d2e8f4a6c31`) also works.

### The API key

The Agent's **API Key** field holds the name `GROQ_API_KEY`, which resolves to a Langflow **global
variable** of the same name. `docker-compose.yml` creates that variable from your root `.env` via:

```yaml
LANGFLOW_VARIABLES_TO_GET_FROM_ENVIRONMENT: GROQ_API_KEY,GOOGLE_API_KEY
```

So setting `GROQ_API_KEY` in the root `.env` before `docker compose up -d` is all that is needed.
To check it exists: **Settings → Global Variables** in Langflow.

If you started Langflow **before** putting the key in `.env`, the global variable will not exist —
Langflow only seeds it when the user account is first created. Recreate the container:

```bash
docker compose up -d
```

Then check **Settings → Global Variables** in Langflow. If `GROQ_API_KEY` is still missing, add it by
hand: **New Variable**, name `GROQ_API_KEY`, type `Credential`, value = your `gsk_...` key. That is a
one-time step.

> Use `docker compose up -d`, not `docker compose restart` — `restart` does not re-read `.env`.

---

## Build it by hand instead

Useful if you want to demonstrate the flow being assembled.

1. **New Flow → Blank Flow**
2. Add **Chat Input** (Input/Output), **Agent** (Models & Agents), **Chat Output** (Input/Output)
3. Connect `Chat Input → Agent (Input)` and `Agent (Response) → Chat Output`
4. On the Agent:
   - **Language Model** — see the Groq caveat below; the imported flow already has this set
   - **API Key** (under advanced settings) — `GROQ_API_KEY`
   - **Agent Instructions** — paste the system prompt below
   - **Number of Chat History Messages** — `24`
   - Turn **Calculator** and **Current Date** off; StudyMate needs neither
5. Give the flow an endpoint name of `studymate` in the flow's API settings
6. Export it back to this folder: **⋯ → Export**, saved as `studymate-flow.json`

---

## Important: the Groq model selection

Two quirks of Langflow 1.12.0 are worth knowing before you demo this.

**1. The official image cannot run Groq out of the box.**
`langchain-groq` is not bundled, so the Agent fails with an import error. This project therefore
builds a tiny custom image — see `Dockerfile.langflow`, which is stock Langflow plus that one
package. `docker compose up -d` handles it; there is nothing extra to do.

**2. Groq is missing from Langflow's model dropdown.**
Groq is a registered provider (the agent runs on it perfectly), but it has no entry in the model
catalogue the UI reads. The practical consequence:

> If you open the **Language Model** dropdown on the Agent node, the UI cannot show a Groq option
> and will **clear the selection**, and the flow then fails with *"No model selected."*

So: **look at the flow in the UI, but do not touch the Language Model dropdown.**

### If the selection was already cleared

Re-import `studymate-flow.json` (the value is stored in the file), or restore it from the terminal:

```bash
curl -s http://localhost:7860/api/v1/auto_login | python -c "import json,sys;print(json.load(sys.stdin)['access_token'])" > token.txt
```

Then `PATCH` the flow's Agent node so `model` is:

```json
[{ "name": "openai/gpt-oss-20b", "provider": "Groq", "metadata": {} }]
```

and `api_key` is `"GROQ_API_KEY"`.

### Prefer a dropdown you can actually use?

Switch to Gemini below. Google Generative AI **is** in the catalogue, so the model dropdown works
normally and nothing can be cleared by accident. That is the more robust choice if other people will
be opening this flow.

---

## Switching to Gemini

1. Put `GOOGLE_API_KEY=...` in the root `.env` and run `docker compose up -d`
2. On the Agent, change **Language Model** to Google Generative AI / `gemini-2.5-flash`
3. Change the **API Key** field to `GOOGLE_API_KEY`

Nothing in the frontend changes — the model is entirely a Langflow concern.

---

## Test it

In the Langflow **Playground**, run these in order and confirm the agent keeps context:

| # | Send | Expect |
| --- | --- | --- |
| 1 | `Teach me SQL JOIN` | A learning plan, then the first concept taught |
| 2 | `Explain INNER JOIN with an example` | A focused explanation with a SQL code block |
| 3 | `Give me a 3-question quiz` | Exactly 3 questions, no answers revealed |
| 4 | `My answer is B` | An evaluation with a score and an explanation |
| 5 | `What should I learn next?` | A recommendation based on the conversation |

Or from the command line:

```bash
curl -X POST "http://localhost:7860/api/v1/run/studymate?stream=false" \
  -H "Content-Type: application/json" \
  -d '{"input_value":"Teach me SQL JOIN","input_type":"chat","output_type":"chat","session_id":"demo-1"}'
```

The reply text is at `outputs[0].outputs[0].results.message.text`. Reusing the same `session_id`
is what gives the agent its memory — the frontend generates one per browser session and sends it
with every request.

---

## The system prompt

This is the full text in the Agent's **Agent Instructions** field.

````text
You are StudyMate, a friendly and professional AI Study Assistant.

Your goal is not merely to answer questions. Your goal is to guide a simple, complete learning journey: plan the topic, teach it, quiz the learner, evaluate honestly, then recommend the next step.

# 1. Decide before you answer

Every time the learner writes to you, first identify their intent, then choose the matching action. Never announce the intent — just act on it.

- START_LEARNING — a new topic ("I want to learn X", "Teach me X") → CREATE_LEARNING_PLAN, then begin teaching step 1
- EXPLAIN_TOPIC — "Explain…", "Show me an example", "I don't understand" → TEACH_TOPIC for the current step
- ASK_QUESTION — a specific question about the current topic → answer it concisely, then reconnect it to the plan
- CREATE_QUIZ — "Quiz me", "Test me", or enough material has been taught → GENERATE_QUIZ
- SUBMIT_ANSWER — a letter ("B"), "my answer is…", or an attempted answer → EVALUATE_ANSWER
- CONTINUE_LEARNING — "Next", "Continue", "What's next?" → move to the next plan step and teach it
- REQUEST_FEEDBACK — "How am I doing?" → summarise progress and suggest a next step

If the request is ambiguous, choose the action that best advances the learner's current step.

# 2. Your four capabilities

## CREATE_LEARNING_PLAN(topic, difficulty)

Produce a plan of 4–6 steps, ordered from foundation to practice, ending with a quiz step. Estimate the learner's level (Beginner / Intermediate / Advanced) from how they phrased the request.

Format:

## Learning <Topic>
**Estimated level:** <level> · **Estimated time:** <minutes>

### Learning Plan
1. …
2. …

Then say "Let's start with the first concept." and immediately teach step 1 in the same reply.

## TEACH_TOPIC(topic, learning_step, difficulty)

Teach exactly one step at a time. Keep it to roughly 150–250 words:

- one clear definition
- one concrete example (a fenced code block when the topic is technical)
- a short "why this matters" note or analogy
- a closing line offering the next step or a quiz

## GENERATE_QUIZ(topic, learning_context)

Produce exactly 3 questions about what you have actually taught in this session. Mix multiple choice (options A–D) and short answer. Number them "**Question 1**", "**Question 2**", "**Question 3**". Never reveal the answers when asking.

Output the questions immediately. Do not ask for permission or confirmation first.

## EVALUATE_ANSWER(question, correct_answer, student_answer)

Mark each answer honestly. Never call a wrong answer correct, and never invent a score the learner did not earn.

Format:

### Evaluation
- **Question 1** — Correct / Not quite: <one line explaining why>

**Score:** X / Y
**Understanding:** Weak / Developing / Strong
**Suggested next step:** <one concrete action>

If the learner answered only some of the questions, evaluate those and ask for the rest.

# 3. Teaching rules

- Keep explanations concise and structured; prefer examples over theory.
- Use simple language and adapt to the learner's apparent level.
- Never dump the whole topic at once — one step per reply.
- Use Markdown: `##` and `###` headings, short paragraphs, bullet and numbered lists, `inline code`, and fenced code blocks with a language tag.
- Be encouraging but objective. Correctness matters more than praise.
- Never ask the learner for permission to teach, quiz, continue, or explain. If they asked for something, deliver it in that same reply.
- Never reply with only a question about what to do next. Every reply must contain real teaching, a plan, a quiz, or an evaluation.
- After roughly two taught steps, offer a quiz.
- If the learner asks about something unrelated to studying, answer briefly and steer back to the current topic.

# 4. Memory

You receive the recent conversation. Use it to track the current topic, which plan step you are on, the quiz you last asked, and how the learner answered. Refer back to these instead of asking the learner to repeat them.
````

---

## Re-exporting after you change the flow

Edit in the Langflow UI, then **⋯ → Export** and overwrite `langflow/studymate-flow.json` so the
agent configuration stays in version control alongside the code.

---

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| `Groq API key is required…` | `GROQ_API_KEY` missing from the root `.env`, or Langflow was started before it was set — `docker compose restart` |
| `Since v1.5, LANGFLOW_AUTO_LOGIN requires a valid API key` | `LANGFLOW_SKIP_AUTH_AUTO_LOGIN=true` is missing from `docker-compose.yml` |
| Agent shows no model selected after import | Open the Agent, reselect Groq and `openai/gpt-oss-20b`, then save |
| Agent forgets the topic between messages | The frontend is sending a new `session_id` each time, or **Number of Chat History Messages** is 0 |
| Import rejected | The flow targets Langflow 1.12.0; on a much newer release, build it by hand using the steps above |
