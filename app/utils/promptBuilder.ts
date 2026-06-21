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
You are a high-precision resume generator producing realistic, technically strong, ATS-friendly resumes.

INPUT

PROFILE: \${profileData}
JOB DESCRIPTION: \${jobDescription}
PLANNER OUTPUT: \${plannerOutput}
DOMAIN: \${domain}
HEADLINE: \${headline}
ROLE PLAN: \${roles}
TOTAL ROLES: \${experienceCount}

---

OUTPUT

Return ONLY one Markdown resume inside a single \`\`\`markdown code block.

---

SUMMARY

- 4–5 sentences, single paragraph
- Resume-style voice only
- No candidate name or third-person pronouns
- Start with role identity + years of experience
- Align with HEADLINE, DOMAIN, and JOB DESCRIPTION

Include:
- core technologies
- specialization
- systems/products/workflows
- business or user impact

Rules:
- Specific over generic
- Vary sentence structure
- Every sentence should include:
  - technology,
  - implementation context,
  - or engineering outcome
- Keep AI-tool mentions minimal and workflow-related

Avoid:
- biography tone
- vague claims
- corporate buzzwords
- repetitive openings

---

SKILLS

- 6–8 technical categories
- 8-10 skills per category
- Prioritize JOB DESCRIPTION relevance without mirroring it too closely
- Include adjacent, foundational, and ecosystem technologies a senior engineer would realistically know
- Uneven category sizes allowed
- Order by strength/relevance

Include where relevant:
- testing
- CI/CD
- observability

Rules:
- Use specific technologies only
- Reflect realistic senior-engineer depth and accumulated experience
- Include adjacent/relevant technologies beyond the JD
- Historically plausible stacks only
- Avoid soft skills, fake tools, duplicates, generic concepts, and excessive JD keyword matching
- Keep AI-tool mentions minimal and natural

---

EXPERIENCE

- Reverse chronological order
- Use ROLE PLAN titles
- First 2 roles: 8–10 bullets
- Remaining roles: 6–8 bullets

Bullet Rules:
- 18–30 words
- Past tense
- Natural sentence ending with period
- Vary structure, density, and verbs

Each bullet should show:
- implementation detail
- technical context
- user/business/operational impact

Reference where relevant:
- APIs
- pipelines
- schemas
- queues
- caching
- auth
- CI/CD
- monitoring
- testing
- dashboards
- onboarding
- reporting
- integrations
- operational tooling

Realism:
- Use company/domain-specific language
- Include concrete implementation details
- Mix feature work with debugging, migration, scaling, reliability, optimization, refactoring, maintenance, incident prevention, and operational issues
- Include occasional edge cases or engineering quirks:
  - stale caches
  - retry handling
  - malformed payloads
  - flaky tests
  - async failures
  - webhook ordering
  - pagination bottlenecks
  - duplicate records
  - timeout spikes
  - state sync bugs
  - legacy compatibility
- Include realistic tradeoffs or temporary fixes where relevant
- Avoid over-packing technologies into single bullets
- Technologies must match historical timeframe
- AI-tool mentions must support real workflows
- Include 1–2 memorable engineering situations across the resume

Additional Rules:
- At least 30% of bullets should involve product features, workflows, customer-facing functionality, or cross-functional collaboration
- Use metrics sparingly and realistically
- Prefer operational scale/context over repeated percentages
- Earlier roles → implementation-heavy
- Later roles → ownership/architecture-heavy
- Allow occasional simpler bullets for realism

Avoid:
- generic SaaS bullets
- repetitive templates
- vague claims
- overly polished achievements
- repeated wording/buzzwords

---

EDUCATION

Include:
- degree
- institution
- graduation year

---

FORMATTING

- No markdown headings (#, ##, ###)
- No bold formatting
- Use plain section titles only:
  - Summary:
  - Technical Skills:
  - Experience:
  - Education:

Format:

\`\`\`markdown
[HEADLINE]
[Candidate Name]

[Contact Info]

Summary:
{summary}

Technical Skills:
• Category: skills

Experience:
[Title] at [Company] : [Dates]
• bullet

Education:
[Degree] | [Institution] | [Year]
\`\`\`

---

STRICT

- Output ONLY final resume
- No commentary or placeholders
- Preserve exact forms:
  - CI/CD
  - Node.js
  - C++
  - API Gateway
  - %
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

export type CoverLetterSubmissionType = 'Manual_Text_Input' | 'PDF_Document';

export const COVER_LETTER_PROMPT_TEMPLATE = `
Write a tailored cover letter for this job application.

Submission type: \${Submission_Type}

If Submission_Type is Manual_Text_Input, use the job description and resume text provided in the conversation.
If Submission_Type is PDF_Document, use the uploaded PDF documents for the job description and resume.

Requirements:
- Match the role and company from the job description
- Highlight relevant experience from the resume only
- Professional tone, 3–4 concise paragraphs
- Do not invent facts not supported by the resume
`.trim();

export function buildCoverLetterPrompt(
  template: string,
  submissionType: CoverLetterSubmissionType = 'Manual_Text_Input'
): string {
  return template.replace(/\$\{Submission_Type\}/g, submissionType);
}

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

export function extractRoleTitlesFromProfile(profileData: string): string[] {
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

function extractJsonFromText(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();
  const braceStart = trimmed.indexOf('{');
  const braceEnd = trimmed.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return trimmed.slice(braceStart, braceEnd + 1);
  }
  return trimmed;
}

function parseStage2Role(role: unknown): Stage2Role | null {
  if (typeof role === 'string') {
    const title = role.trim();
    if (!title) return null;
    return { original_title: title, normalized_title: title, adapted_title: title };
  }
  if (role && typeof role === 'object') {
    const r = role as Record<string, unknown>;
    const original = String(r.original_title ?? r.originalTitle ?? '').trim();
    const normalized = String(r.normalized_title ?? r.normalizedTitle ?? original).trim();
    const adapted = String(r.adapted_title ?? r.adaptedTitle ?? normalized).trim();
    if (!original && !normalized && !adapted) return null;
    return {
      original_title: original || normalized || adapted,
      normalized_title: normalized || original || adapted,
      adapted_title: adapted || normalized || original,
    };
  }
  return null;
}

export function parseStage1Output(raw: string): Stage1Output | null {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(extractJsonFromText(raw)) as Record<string, unknown>;
    const domain = String(parsed.domain ?? '').trim();
    const headline = String(parsed.headline ?? '').trim();
    const seniority = String(parsed.seniority ?? '').trim();
    if (!domain || !headline) return null;

    const roles: Stage2Role[] = [];
    if (Array.isArray(parsed.roles)) {
      for (const role of parsed.roles) {
        const parsedRole = parseStage2Role(role);
        if (parsedRole) roles.push(parsedRole);
      }
    }

    return {
      domain,
      headline,
      seniority: seniority || 'Senior',
      roles,
    };
  } catch {
    return null;
  }
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
  stage3Output?: Stage3Output,
  plannerOutput?: string
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
  out = substituteLiteral(out, '${plannerOutput}', plannerOutput ?? '');
  return out;
}

export function buildStage1Prompt(
  profileData: string,
  jobDescription: string,
  promptTemplate?: string,
  targetTitle?: string
) {
  const jobDescWrapped = `{${jobDescription}}`;
  const titleForPrompt = (targetTitle != null && String(targetTitle).trim() !== ''
    ? String(targetTitle).trim()
    : DEFAULT_TARGET_TITLE);
  const template = promptTemplate?.trim() || DEFAULT_STAGE1_PROMPT_TEMPLATE;

  return applyPromptPlaceholders(template, profileData, jobDescWrapped, titleForPrompt);
}

export function buildStage3Prompt(
  profileData: string,
  jobDescription: string,
  stage1Output: Stage1Output,
  stage2Output?: Stage2Output,
  promptTemplate?: string,
  targetTitle?: string,
  plannerOutput?: string
) {
  const jobDescWrapped = `{${jobDescription}}`;
  const titleForPrompt = (targetTitle != null && String(targetTitle).trim() !== ''
    ? String(targetTitle).trim()
    : DEFAULT_TARGET_TITLE);
  const template = promptTemplate?.trim() || DEFAULT_STAGE3_PROMPT_TEMPLATE;
  const stage1ForPrompt: Stage1Output = {
    ...stage1Output,
    headline: titleForPrompt,
  };

  return applyPromptPlaceholders(
    template,
    profileData,
    jobDescWrapped,
    titleForPrompt,
    stage1ForPrompt,
    stage2Output,
    undefined,
    plannerOutput
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

