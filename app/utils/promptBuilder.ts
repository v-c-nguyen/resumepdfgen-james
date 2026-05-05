export const DEFAULT_STAGE1_PROMPT_TEMPLATE = `
You are a strict classifier and career trajectory planner.

INPUT:
PROFILE:
\${profileData}

JOB DESCRIPTION:
\${jobDescription}

---

OUTPUT JSON ONLY:

{
  "domain": "Software | DevOps | Data | ML | Cloud | Solutions",
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

## PART A — CLASSIFICATION

### Domain Detection

Default:
? "Software"

Switch ONLY if strong signals (=3):

- DevOps ? CI/CD, Kubernetes, Terraform, infrastructure, pipelines
- Data ? ETL, Spark, Airflow, warehousing, big data
- ML ? models, training, NLP, inference
- Cloud ? AWS/GCP/Azure-heavy infra
- Solutions ? client-facing, pre-sales, integrations

---

### Headline Rules

- Default: "Senior Software Engineer"
- If domain ? Software:
  ? "Senior {Domain} Engineer"

Examples:
- DevOps ? Senior DevOps Engineer
- Data ? Senior Data Engineer

---

### Seniority

- =5 years ? Senior
- 2–5 ? Mid
- <2 ? Junior

---

## PART B — ROLE PLAN (uses DOMAIN + SENIORITY from Part A)

Infer roles from PROFILE experience history (same order as in PROFILE).

### Step 1: Normalize Titles

- Developer ? Software Engineer
- Programmer Analyst ? Software Engineer

---

### Step 2: Apply Domain Adaptation

If DOMAIN ? Software:

- Software Engineer ? {Domain} Engineer
- Senior Software Engineer ? Senior {Domain} Engineer

---

### Step 3: Preserve Trajectory

- Maintain seniority progression
- Do NOT upgrade or downgrade roles
- Earlier roles = later roles

---

### Step 4: Partial Transition

- Earlier roles MAY stay as Software Engineer
- At least 70% should match DOMAIN if strong fit

---

### Step 5: Safeguards

- Do NOT introduce:
  - Lead, Staff, Principal, Architect
- Do NOT change unrelated roles

---

## STRICT

- One JSON object only: domain, headline, seniority, and roles together
- Keep same number of roles as experience entries in PROFILE
- No explanation
- JSON only
`.trim();

export const DEFAULT_STAGE3_PROMPT_TEMPLATE = `
You are a deterministic resume content generator.

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

- EXACTLY 5 sentences
- Output MUST be a single paragraph (no line breaks)
- Do NOT use bullets, numbering, or list formatting in the output
- Sentences must be separated only by periods and spaces
- Align with HEADLINE + DOMAIN
- Include:
  - experience
  - technologies
  - systems
  - business impact

---

## SKILLS

- EXACTLY 6 ~ 8 categories
- EXACTLY 8 ~ 10 skills each
- 50–60% from JOB DESCRIPTION
- Include:
  - testing
  - CI/CD
  - monitoring

- No duplicates
- No fake tools

---

## EXPERIENCE

Use ROLE PLAN titles.

---

### Bullet Rules

- First 2 roles ? 8 bullets
- Others ? 6 bullets

Each bullet:
- exactly more than 25 characters
- Action + Tech + System + Impact
- End with period

---

### Metrics

- EXACTLY 3 bullets per role include metrics
- Others must NOT

---

### Architecture

- EXACTLY 2 bullets per role:
  - system design / ownership
  - NO metrics

---

### Domain Justification

- Bullets MUST reflect DOMAIN
- If not possible ? fallback to Software concepts

---

### Style

- No repeated verbs >2 times per role
- Natural language
- MUST USE PAST TENSE for each bullet

---

## MARKDOWN FORMAT

\`\`\`markdown
[HEADLINE]
[Candidate Name]

[Contact line: Email | Phone | Location | LinkedIn]
- Include ONLY fields present
- Correct separator formatting

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

## STRICT

- No extra text
- No missing sections
- Clean formatting

## FORMAT INVARIANCE RULES (CRITICAL)

You MUST preserve technical correctness, symbols, punctuation, and formatting exactly as specified below.

---

## 1. SYMBOL LOCK (DO NOT MODIFY)

Always preserve these EXACT forms:

- CI/CD (never CI CD)
- 30% (never 30 percent)
- R&D (never R and D)
- Node.js (never Node js)
- C++ (never C plus plus)
- API Gateway (unchanged)

---

## 2. PUNCTUATION RULES (STRICT)

- Each bullet MUST be a complete sentence
- Use commas to separate multiple actions or clauses
- Do NOT remove commas for simplification
- Each bullet MUST end with a period (.)

---

## 3. WORD COUNT RULE (HARD CONSTRAINT)

- Each bullet MUST be EXACTLY 20 words
- Period is NOT counted as a word
- Do NOT approximate or exceed limit

---

## 4. SENTENCE STRUCTURE

Each bullet MUST follow:

Action + Technology + System + Detail + Business Impact

- Commas are allowed and required for multi-action clarity
- Do NOT flatten sentences into comma-less chains

---

## 5. ANTI-SIMPLIFICATION RULE

Do NOT:
- Replace symbols with words
- Remove punctuation
- Simplify technical terms
- Reformat into plain English style
- Change past tense
---

## 6. VALIDATION (MANDATORY)

Before output, ensure:

- All symbols are intact
- Commas are present where multiple actions exist
- Each bullet = exactly 20 words
- Each sentence is grammatically valid

If any rule fails:
→ Rewrite before final output
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
  roles: Stage2Role[];
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
      stage1Output
    );
  }

  return applyPromptPlaceholders(
    DEFAULT_STAGE3_PROMPT_TEMPLATE,
    profileData,
    jobDescWrapped,
    titleForPrompt,
    stage1Output
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

