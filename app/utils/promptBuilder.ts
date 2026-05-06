export const DEFAULT_STAGE1_PROMPT_TEMPLATE = `
# STRICT ROLE CLASSIFIER + TRAJECTORY GENERATOR

Deterministic. No interpretation beyond rules.

---

## INPUT

PROFILE:
\${profileData}

JOB DESCRIPTION:
\${jobDescription}

---

## OUTPUT (JSON ONLY)

{
  "domain": "FullStack | AI Integration | Applied AI | AI/ML | Salesforce | Solutions | DevOps | Data | QA",
  "headline": "string",
  "seniority": "Junior | Mid | Senior",
  "roles": [
    {
      "original_title": "",
      "normalized_title": "",
      "adapted_title": ""
    }
  ]
}

---

## 1. DOMAIN

Default → FullStack

Switch ONLY if ≥3 matching signals in JOB DESCRIPTION:

- AI Integration → LLM APIs, OpenAI, copilots, embeddings, RAG
- Applied AI → agents, workflows, automation, orchestration
- AI/ML → training, NLP, deep learning, ML pipelines
- DevOps → CI/CD, Kubernetes, Terraform, infra, SRE
- Data → ETL, Spark, Airflow, warehousing
- Salesforce → Apex, Lightning, Salesforce
- Solutions → client-facing, pre-sales, integrations
- QA → testing, automation testing, Selenium, Cypress, Playwright, SDET, QA pipelines

---

## 2. HEADLINE (STRICT MAP)

FullStack → Senior Software Engineer  
AI Integration → Senior Software Engineer (AI Integration)  
Applied AI → Senior Software Engineer (Applied AI & Full Stack)  
AI/ML → Senior AI/ML Engineer  
DevOps → Senior DevOps Engineer  
Data → Senior Data Engineer  
Salesforce → Salesforce Technical Architect  
Solutions → Senior Solutions Engineer  
QA → Senior QA Automation Engineer | SDET  
---

## 3. SENIORITY

≥5 years → Senior  
2–5 years → Mid  
<2 years → Junior  

---

## 4. NORMALIZATION

Apply to PROFILE roles:

- Developer → Software Engineer  
- Programmer Analyst → Software Engineer  
- Intern → Software Engineering Intern 
- QA Tester → QA Tester  
- QA Engineer → QA Engineer 

---

## 5. ROLE TEMPLATES (BASE ORDER = EARLIEST → LATEST)

AI/ML:
[Data Engineer, Machine Learning Engineer, Senior Machine Learning Engineer, Senior AI/ML Engineer]

DevOps:
[Software Engineer, Platform Engineer, Senior DevOps Engineer, Senior DevOps Engineer]

Solutions:
[Software Engineering Intern, Software Engineer, Senior Software Engineer, Senior Solutions Engineer]

Salesforce:
[Salesforce Developer/Admin, Salesforce Developer, Senior Salesforce Developer, Salesforce Technical Architect]

Data:
[Software Engineer, Backend Engineer, Data Engineer, Senior Data Engineer]

QA:
[QA Tester, QA Engineer, Senior QA Engineer, Senior QA Automation Engineer]

---

## 6. ROLE ASSIGNMENT

Let:
- P = number of PROFILE roles
- T = template (size = 4)

### If domain ∈ {AI/ML, DevOps, Solutions, Salesforce, Data}:

IF P ≤ 4:
→ Use LAST P roles from template

IF P > 4:
→ Extend by repeating earliest roles:
Example (P=6):
[T1, T1, T2, T3, T4, T4]

---

### If domain = AI Integration:

- Last role = **Senior Software Engineer (AI Integration)**
- All previous roles = Keep previous roles

---

### If domain = Applied AI:

- Last role = **Senior Software Engineer (Applied AI & Full Stack)**
- All previous roles = Keep previous roles

---

### If domain = FullStack:

- Adapted roles = Keep previous roles

---

## 7. HARD CONSTRAINTS

- Preserve role count EXACTLY = PROFILE
- Preserve reverse chronological order (latest → earliest)
- First role must be most recent
- Last role must be oldest
- Apply template mapping in chronological order, then reverse before output
- Do NOT introduce:
  Lead, Staff, Principal, Architect  
  (EXCEPTION: Salesforce template allows Architect)
- Do NOT mix domains
- No invented roles outside templates

---

## 8. OUTPUT RULES

- JSON ONLY
- No explanation
- No extra text
- All fields required
- Deterministic output
`.trim();

export const DEFAULT_STAGE3_PROMPT_TEMPLATE = `
You are a high-precision resume content generator that produces realistic, human-readable, and technically strong resumes.

INPUT:

PROFILE:
\${profileData}

JOB DESCRIPTION:
\${jobDescription}

DOMAIN:
\${domain}

HEADLINE:
\${headline}

ROLE PLAN:
\${roles}

TOTAL ROLES:
\${experienceCount}

---

OUTPUT:
Return ONLY a Markdown resume in a single \`\`\`markdown code block.

---

## SUMMARY

- EXACTLY 4–5 sentences
- Single paragraph (no line breaks)
- No bullets or numbering
- Align with HEADLINE + DOMAIN

Must include:
- years of experience
- core technologies
- type of systems built
- business or user impact

Style:
- Natural and human
- Avoid buzzwords and repetition
- Should feel like a real professional summary, not generated text

---

## SKILLS

- 6–8 categories
- 6–10 skills per category
- 50–60% aligned with JOB DESCRIPTION

Must include:
- testing
- CI/CD
- monitoring

Rules:
- No duplicates
- No fake or obscure tools
- Order skills by strength (most relevant first)

---

## EXPERIENCE

Use ROLE PLAN titles.

---

### Bullet Rules

- First 2 roles: 6–8 bullets
- Remaining roles: 4–6 bullets

Each bullet MUST:
- Be 18–30 words
- Be written in past tense
- Be a complete, natural sentence
- End with a period

---

### Content Requirements (CRITICAL)

Each bullet should clearly describe:
- what was built or improved
- how it was implemented (technology)
- why it mattered (user or business impact)

Each bullet MUST include at least one:
- specific feature (e.g., onboarding flow, dashboards, payments, APIs)
- user or customer context
- business problem or workflow

Avoid vague phrases like:
- “various systems”
- “enterprise platforms”
- “distributed environments” (unless clearly explained)

---

### Metrics

- Use metrics ONLY when realistic (0–3 per role)
- Avoid repeating similar percentages across bullets
- Metrics must feel believable and tied to actual improvements

---

### Architecture / Ownership

- 1–2 bullets per role should show:
  - system design OR
  - ownership of a feature, service, or component

Avoid repeating generic phrases like “designed scalable architecture”

---

### Product & Collaboration

- At least 30% of bullets should reflect:
  - product features
  - user workflows
  - customer-facing functionality

Include collaboration with:
- product managers
- designers
- cross-functional teams

---

### Modern Engineering Signals

Include where applicable:
- AI-assisted development tools (e.g., Copilot, Claude, Cursor)
- performance optimization
- testing strategies
- real-world constraints (scale, reliability, usability)

---

### Style Rules

- Avoid repeating the same verbs more than 2 times per role
- Vary sentence structure
- Use clear, concise, human-readable language
- Prefer specific descriptions over buzzwords

Limit buzzword usage:
- “distributed systems” → max 2 per role
- “scalable” → max 2 per role
- “enterprise” → max 1 per role

---

### AUTHENTICITY RULE (MANDATORY)

If a bullet could apply to any company or role, rewrite it to include:
- specific implementation detail OR
- feature-level context OR
- meaningful technical decision

---

## MARKDOWN FORMAT

\`\`\`markdown
[HEADLINE]
[Candidate Name]

[Contact line: Email | Phone | Location | LinkedIn]
- Include ONLY fields present

Summary:
{summary}

Technical Skills:
• {Category}: skill, skill, skill

Experience:
{For each role}
[Title] at [Company] : [Dates]
• bullet

Education:
[Degree] | [Institution] | [Year]
\`\`\`

---

## SYMBOL & FORMATTING RULES

Preserve exact forms:
- CI/CD
- Node.js
- C++
- API Gateway
- %

Use proper punctuation:
- Commas for clarity where needed
- Each bullet ends with a period

---

## PRIORITY ORDER (VERY IMPORTANT)

If constraints conflict, prioritize:
1. Clarity and readability
2. Realism and authenticity
3. Technical accuracy
4. Formatting consistency

---

## STRICT

- No extra commentary
- No missing sections
- Output ONLY the final markdown
`.trim();

export const DEFAULT_STAGE4_PROMPT_TEMPLATE = `
You are a deterministic resume formatter.

INPUT:

PROFILE:
\${profileData}

HEADLINE:
\${headline}

CONTENT:
\${contentJson}

---

OUTPUT:

Return ONLY a Markdown resume in a single \`\`\`markdown code block.

---

## FORMAT

\`\`\`markdown
[HEADLINE]
[Candidate Name]

[Contact line: Email | Phone | Location | LinkedIn]
- Include ONLY fields present
- Correct separator formatting

---

Summary:
{summary}

---

Technical Skills:
• {Category}: skill, skill, skill

---

Experience:
{For each role}
[Title] at [Company] : [Dates]
• bullet

---

Education:
[Degree] | [Institution] | [Year]
\`\`\`

---

## STRICT

- No extra text
- No missing sections
- Clean formatting
`.trim();

export const QA_PROMPT_TEMPLATE =
  'Answer the following questions based strictly on the provided Job Description and Resume. Each response must be 1–2 concise sentences, directly relevant, and grounded in the candidate’s experience. Avoid assumptions, filler, or repetition, and ensure answers are specific, professional, and fact-based.';

const DEFAULT_TARGET_TITLE = 'Senior Software Engineer';

export type Stage2Role = {
  original_title: string;
  normalized_title: string;
  adapted_title: string;
};

export type Stage1Output = {
  domain: string;
  headline: string;
  seniority: string;
  roles: Stage2Role[];
};

/** Legacy wrapper used only for optional override of roles in {@link applyPromptPlaceholders}. */
export type Stage2Output = {
  roles: string[];
};

export type Stage3SkillCategory = {
  category: string;
  items: string[];
};

export type Stage3ExperienceItem = {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
};

export type Stage3Output = {
  summary: string;
  skills: Stage3SkillCategory[];
  experience: Stage3ExperienceItem[];
};

function experienceCountFromResumeText(resumeText: string): number {
  const lines = resumeText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const roleLike = lines.filter(
    (l) => /\bat\b/i.test(l) && /(\d{4}|present|current)/i.test(l) && l.length > 12
  );
  const n = roleLike.length;
  return Math.min(Math.max(n || 1, 1), 20);
}

function normalizeTitle(title: string): string {
  const t = title.trim();
  if (!t) return 'Software Engineer';
  if (/developer/i.test(t)) return t.replace(/developer/gi, 'Software Engineer');
  if (/programmer\s*analyst/i.test(t)) return t.replace(/programmer\s*analyst/gi, 'Software Engineer');
  return t;
}

function extractRoleTitlesFromProfile(profileData: string): string[] {
  const lines = profileData.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    const m = line.match(/^(.+?)\s+at\s+.+?:\s*(.+)$/i);
    if (m && /(\d{4}|present|current)/i.test(m[2] ?? '')) {
      out.push(m[1].trim());
    }
  }
  return out;
}

export function buildFallbackStage1Output(profileData: string, targetTitle?: string): Stage1Output {
  const fallbackHeadline =
    targetTitle != null && String(targetTitle).trim() !== ''
      ? String(targetTitle).trim()
      : DEFAULT_TARGET_TITLE;

  const roleTitles = extractRoleTitlesFromProfile(profileData);
  const roles = (roleTitles.length ? roleTitles : ['Software Engineer']).map((title) => {
    const normalized = normalizeTitle(title);
    return {
      original_title: title,
      normalized_title: normalized,
      adapted_title: normalized,
    };
  });

  return {
    domain: 'Software',
    headline: fallbackHeadline,
    seniority: 'Senior',
    roles,
  };
}

function substituteLiteral(haystack: string, needle: string, value: string): string {
  return haystack.split(needle).join(value);
}

function applyPromptPlaceholders(
  template: string,
  profileData: string,
  jobDescWrapped: string,
  titleForPrompt: string,
  stage1Output?: Stage1Output,
  stage2Output?: Stage2Output,
  stage3Output?: Stage3Output
): string {
  const expCount = String(experienceCountFromResumeText(profileData));
  const roles =
    stage2Output?.roles ??
    stage1Output?.roles;
  const rolesJson = roles !== undefined ? JSON.stringify(roles, null, 2) : '';
  const contentJson = stage3Output ? JSON.stringify(stage3Output, null, 2) : '';

  let out = template;
  out = substituteLiteral(out, '${profileData.experience.length}', expCount);
  out = substituteLiteral(out, '${profileData.experience}', profileData);
  out = substituteLiteral(out, '${experienceCount}', expCount);
  out = substituteLiteral(out, '${jobDescription}', jobDescWrapped);
  out = substituteLiteral(out, '${targetTitle}', titleForPrompt);
  out = substituteLiteral(out, '${baseResume}', profileData);
  out = substituteLiteral(out, '${profileData}', profileData);
  out = substituteLiteral(out, '${domain}', stage1Output?.domain ?? '');
  out = substituteLiteral(out, '${headline}', stage1Output?.headline ?? '');
  out = substituteLiteral(out, '${seniority}', stage1Output?.seniority ?? '');
  out = substituteLiteral(out, '${roles}', rolesJson);
  out = substituteLiteral(out, '${contentJson}', contentJson);
  return out;
}

export function buildStage1Prompt(
  profileData: string,
  jobDescription: string,
  customStage1Prompt?: string,
  targetTitle?: string
) {
  const jobDescWrapped = `{${jobDescription}}`;
  const titleForPrompt = (targetTitle != null && String(targetTitle).trim() !== ''
    ? String(targetTitle).trim()
    : DEFAULT_TARGET_TITLE);

  if (customStage1Prompt) {
    return applyPromptPlaceholders(customStage1Prompt, profileData, jobDescWrapped, titleForPrompt);
  }

  return applyPromptPlaceholders(DEFAULT_STAGE1_PROMPT_TEMPLATE, profileData, jobDescWrapped, titleForPrompt);
}

export function buildStage3Prompt(
  profileData: string,
  jobDescription: string,
  stage1Output: Stage1Output,
  stage2Output?: Stage2Output,
  customStage3Prompt?: string,
  targetTitle?: string
) {
  const jobDescWrapped = `{${jobDescription}}`;
  const titleForPrompt = (targetTitle != null && String(targetTitle).trim() !== ''
    ? String(targetTitle).trim()
    : DEFAULT_TARGET_TITLE);

  if (customStage3Prompt) {
    return applyPromptPlaceholders(
      customStage3Prompt,
      profileData,
      jobDescWrapped,
      titleForPrompt,
      stage1Output,
      stage2Output
    );
  }

  return applyPromptPlaceholders(
    DEFAULT_STAGE3_PROMPT_TEMPLATE,
    profileData,
    jobDescWrapped,
    titleForPrompt,
    stage1Output,
    stage2Output
  );
}

export function buildStage4Prompt(
  profileData: string,
  jobDescription: string,
  stage1Output: Stage1Output,
  stage3Output: Stage3Output,
  customStage4Prompt?: string,
  targetTitle?: string
) {
  const jobDescWrapped = `{${jobDescription}}`;
  const titleForPrompt = (targetTitle != null && String(targetTitle).trim() !== ''
    ? String(targetTitle).trim()
    : DEFAULT_TARGET_TITLE);

  if (customStage4Prompt) {
    return applyPromptPlaceholders(
      customStage4Prompt,
      profileData,
      jobDescWrapped,
      titleForPrompt,
      stage1Output,
      undefined,
      stage3Output
    );
  }

  return applyPromptPlaceholders(
    DEFAULT_STAGE4_PROMPT_TEMPLATE,
    profileData,
    jobDescWrapped,
    titleForPrompt,
    stage1Output,
    undefined,
    stage3Output
  );
}

