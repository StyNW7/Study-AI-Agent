/**
 * Development-only stand-in for the Langflow agent.
 *
 * Enabled with VITE_USE_MOCK_AI=true so the interface can be built and demoed
 * while Langflow is offline. The real agent always runs in Langflow.
 */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Intent = 'quiz' | 'answer' | 'next' | 'explain' | 'start'

function detectIntent(message: string, turn: number): Intent {
  const text = message.toLowerCase()
  if (/\bquiz\b|\btest me\b|\bquestions?\b/.test(text)) return 'quiz'
  if (/^\s*(a|b|c|d)\s*[.)]?\s*$/i.test(message) || /my answer|the answer is|i think/.test(text)) return 'answer'
  if (/what.*next|next step|continue/.test(text)) return 'next'
  if (turn === 0) return 'start'
  return 'explain'
}

function topicOf(message: string): string {
  const cleaned = message
    .replace(/^(teach me|explain|help me (to )?(learn|understand)|i want to learn|learn)\s+/i, '')
    .replace(/[.?!]+$/, '')
    .trim()
  return cleaned || 'your topic'
}

const plan = (topic: string) => `## Learning ${topic}

**Estimated level:** Beginner · **Estimated time:** ~20 minutes

### Learning Plan

1. Understand the core idea and vocabulary
2. See a minimal worked example
3. Learn the most common variations
4. Recognise the classic mistakes
5. Practise on a small problem
6. Take a short quiz

Let's start with the first concept.

### 1. The core idea

${topic} is easiest to understand as a relationship between two things: what you have, and what you want to produce. Start by naming both precisely — most confusion later comes from skipping this step.

\`\`\`text
input  ──▶  rule you apply  ──▶  result
\`\`\`

Ask me to go deeper on any step, or say **"give me a quiz"** whenever you feel ready.`

const lesson = (topic: string) => `### A closer look at ${topic}

Here is the pattern you will use most often:

\`\`\`sql
SELECT users.name, orders.total
FROM users
INNER JOIN orders
  ON users.id = orders.user_id;
\`\`\`

Reading it line by line:

- \`FROM users\` — the table you start from
- \`INNER JOIN orders\` — the table you attach to it
- \`ON users.id = orders.user_id\` — the rule that decides which rows belong together

**Key point:** rows only survive if the rule matches on *both* sides. A user with no orders simply disappears from the result.

Ready for a quick quiz?`

const quiz = (topic: string) => `### Quiz — ${topic}

Answer with the letter, or in your own words.

**Question 1**
Which JOIN returns only records with matching values in both tables?

A. LEFT JOIN
B. INNER JOIN
C. RIGHT JOIN
D. FULL JOIN

**Question 2**
What happens to a user row that has no matching order in an INNER JOIN?

**Question 3**
Which clause defines how two tables are matched together?`

const evaluation = () => `### Evaluation

**Correct.** INNER JOIN keeps only the rows where the matching rule succeeds in both tables.

- **Question 1** — Correct: B, INNER JOIN
- **Question 2** — Correct: the row is dropped from the result
- **Question 3** — Correct: the \`ON\` clause

**Score:** 3 / 3
**Understanding:** Strong

**Suggested next step:** write an INNER JOIN of your own against three tables, then compare it with a LEFT JOIN to see which rows reappear.`

const next = (topic: string) => `### What to learn next

You have the core of ${topic}. A sensible next step:

1. **LEFT JOIN** — keep every row from the left table, matched or not
2. **Multi-table joins** — chaining three or more tables safely
3. **Filtering vs. joining** — why a condition in \`ON\` behaves differently from one in \`WHERE\`

Say **"teach me LEFT JOIN"** and we'll continue.`

let currentTopic = 'your topic'

export async function sendMockMessage(message: string, turn: number): Promise<string> {
  await wait(700 + Math.random() * 800)

  const intent = detectIntent(message, turn)
  if (intent === 'start') currentTopic = topicOf(message)

  switch (intent) {
    case 'start':
      return plan(currentTopic)
    case 'quiz':
      return quiz(currentTopic)
    case 'answer':
      return evaluation()
    case 'next':
      return next(currentTopic)
    default:
      return lesson(currentTopic)
  }
}
