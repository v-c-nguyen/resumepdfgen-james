/**
 * Default prompt template used when building prompts with a job description.
 * Placeholders: ${profileData}, ${jobDescription}, ${targetTitle}
 */
export const DEFAULT_PROMPT_TEMPLATE = `
You are a deterministic ATS resume generation engine.

Return ONLY a Markdown resume inside a single code block labeled \`markdown\`.

Do NOT output explanations, reasoning, or extra text.

---

## INPUTS

PROFILE:
\${profileData}

JOB DESCRIPTION:
\${jobDescription}

TARGET TITLE (DO NOT MODIFY):
\${targetTitle}

---

## TITLE CONTROL (STRICT)

Resume headline MUST be exactly:
→ \${targetTitle}

- Do NOT generate, modify, or infer title
- JD only influences content, NOT identity
- Summary must reflect the same role context
- Experience titles remain unchanged from profile data

---

## INTERNAL PROCESS (DO NOT OUTPUT)

- Extract JD keywords (primary, secondary, domain)
- Infer industry from JD
- Map JD into Summary, Skills, Experience
- Embed 1–2 system-level initiatives in recent roles (no project section)

---

## OUTPUT FORMAT

'''markdown
[TARGET TITLE]
[Candidate Name]

[Contact line: include ONLY fields present in PROFILE data, in this order: Email | Phone | Location | Linkedin]
[If a field is missing in PROFILE data, omit it entirely. Do not leave placeholders, do not insert dummy values.]

Summary:
[5–6 sentence single paragraph]

Technical Skills:
• Category: Skill, Skill, Skill

Experience:
[Role] at [Company] : [Start – End]
• Bullet

Education:
[Degree] | [Institution] | [Year]
'''

---

## SUMMARY

- 5 sentences, single paragraph
- Include: role context, experience, key technologies, industry alignment,
  system impact, scalability/reliability, collaboration, business value

---

## TECHNICAL SKILLS

- 6–7 categories
- ≥ 8 skills per category, ≥ 50 total
- 50–65% JD keywords
- no repetitive categories
- Include testing, CI/CD, and observability when relevant

---

## EXPERIENCE (STRICT)

Generate exactly \${profileData.experience.length} roles.

Per role:
- recent roles: 7–8 bullets
- older roles: 5–6 bullets

Each bullet MUST:
- follow: Action + Technology + System + Business Impact (+ metric if meaningful)
- be 20–40 words, detailed, and natural (no short or fragmented bullets)
- be a complete sentence and end with a period (.)

---

## SYSTEMS THINKING & OWNERSHIP

Each role must show:
- ownership of systems/services (not tasks)
- end-to-end responsibility
- architecture/design decisions
- scalability, reliability, performance awareness

Include 2–3 system-level bullets per role.

---

## BUSINESS IMPACT

Every role must connect work to business value:
- revenue, user growth, engagement, efficiency, cost, SLA, or product impact

Do NOT stop at technical improvements — explain why it matters.

---

## METRICS BALANCE (CRITICAL)

Each role MUST include:
- at least 2–3 metric-driven bullets

Limit:
- ≤ 40% of bullets may include metrics

Use metrics for:
- performance, scale, cost, reliability, growth

Avoid metrics for:
- architecture, ownership, collaboration

Metrics must:
- be realistic and varied (%, counts, scale like “50K users”, “10M events/day”)
- include context (system size, users, traffic)

---

## INDUSTRY ALIGNMENT (DYNAMIC)

Infer industry from JD using product, users, and business model.

Reference examples:
FinTech, Healthcare, Security, SaaS, Data, E-commerce, AdTech, EdTech, Logistics,
Travel, Gaming, Automotive, HR Tech, Insurance, Enterprise Software

Rules:
- Recent roles must reflect inferred industry
- Use domain-specific terminology
- Business impact must match industry context

Do NOT force-fit into any category.

---

## ATS KEYWORD PRECISION

Ensure JD-critical tools appear across Skills and Experience:
- Frontend: React, TypeScript
- Backend: Node.js, APIs, frameworks
- Cloud: AWS, GCP, Azure
- Integrations: APIs, third-party systems (ERP, payments, etc.)
- Data: pipelines, warehousing (e.g., Snowflake)

Always include:
- testing frameworks
- CI/CD tools
- observability tools

---

## EXPERIENCE INTEGRATION (NO PROJECT SECTION)

- Do NOT create a “Project” section
- Do NOT label bullets as projects
- Embed system initiatives naturally within roles
- Include system purpose, architecture, scale, and business impact

---

## RECRUITER & CULTURE FIT

Include naturally:
- cross-functional collaboration
- ownership mindset
- product thinking
- communication and accountability

---

## FINAL RULE

Return ONLY the Markdown resume.
No extra text.

## CONTACT DATA INTEGRITY (CRITICAL)

- Use ONLY contact details explicitly present in PROFILE data.
- NEVER invent, infer, or use placeholder contact values.
- If phone is missing in PROFILE data, do NOT output a phone number line/value.
- Forbidden examples: "+63 000 000 0000", "000-000-0000", "N/A", "[Phone]".
`.trim();

const DEFAULT_TARGET_TITLE = 'Senior Software Engineer';

/** Plain-text resume has no `.experience`; approximate role count for the prompt. */
function experienceCountFromResumeText(resumeText: string): number {
  const lines = resumeText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const roleLike = lines.filter(
    (l) => /\bat\b/i.test(l) && /(\d{4}|present|current)/i.test(l) && l.length > 12
  );
  const n = roleLike.length;
  return Math.min(Math.max(n || 1, 1), 20);
}

/** Split/join avoids RegExp replacement rules when `value` contains `$` or `&`. */
function substituteLiteral(haystack: string, needle: string, value: string): string {
  return haystack.split(needle).join(value);
}

function applyPromptPlaceholders(
  template: string,
  profileData: string,
  jobDescWrapped: string,
  titleForPrompt: string
): string {
  const expCount = String(experienceCountFromResumeText(profileData));
  let out = template;
  // Longer / more specific tokens first so `${profileData}` does not truncate `${profileData.experience.length}`
  out = substituteLiteral(out, '${profileData.experience.length}', expCount);
  out = substituteLiteral(out, '${jobDescription}', jobDescWrapped);
  out = substituteLiteral(out, '${targetTitle}', titleForPrompt);
  out = substituteLiteral(out, '${baseResume}', profileData);
  out = substituteLiteral(out, '${profileData}', profileData);
  return out;
}

// Helper to build OpenAI prompt (profileData = resume text from selected profile)
export function buildPrompt(
  profileData: string,
  jobDescription: string,
  customPrompt?: string,
  targetTitle?: string
) {
  const jobDescWrapped = `{${jobDescription}}`;
  const titleForPrompt = (targetTitle != null && String(targetTitle).trim() !== ''
    ? String(targetTitle).trim()
    : DEFAULT_TARGET_TITLE);

  if (customPrompt) {
    return applyPromptPlaceholders(customPrompt, profileData, jobDescWrapped, titleForPrompt);
  }

  return applyPromptPlaceholders(DEFAULT_PROMPT_TEMPLATE, profileData, jobDescWrapped, titleForPrompt);
}

