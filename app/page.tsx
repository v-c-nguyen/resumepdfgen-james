'use client';
import { useRef, useEffect, useState } from 'react';
import { Copy, Check, Mail, Phone, MapPin, Linkedin, Sparkles, FileDown } from 'lucide-react';
import { BaseResumeProfile } from './data/baseResumes';
import {
  buildStage3Prompt,
  extractRoleTitlesFromProfile,
  QA_PROMPT_TEMPLATE,
  Stage1Output,
  Stage2Output,
} from './utils/promptBuilder';

const btnMotion = 'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]';
const DEFAULT_DOMAIN_KEY = 'Default' as const;

const DOMAIN_OPTIONS = [
  { key: DEFAULT_DOMAIN_KEY, label: 'Default (from profile)' },
  { key: 'FullStack', label: 'Full Stack', headline: 'Senior Software Engineer' },
  { key: 'AI Integration', label: 'AI Integration', headline: 'Senior Software Engineer (AI Integration)' },
  { key: 'Applied AI', label: 'Applied AI', headline: 'Senior Software Engineer (Applied AI & Full Stack)' },
  { key: 'AI/ML', label: 'AI/ML', headline: 'Senior AI/ML Engineer' },
  { key: 'DevOps', label: 'DevOps', headline: 'Senior DevOps Engineer' },
  { key: 'Data', label: 'Data', headline: 'Senior Data Engineer' },
  { key: 'Salesforce', label: 'Salesforce', headline: 'Salesforce Technical Architect' },
  { key: 'Solutions', label: 'Solutions', headline: 'Senior Solutions Engineer' },
  { key: 'QA', label: 'QA', headline: 'Senior QA Automation Engineer' },
  {
    key: 'SDR & Outbound Sales',
    label: 'SDR & Outbound Sales',
    headline: 'Senior SDR & Outbound Sales Specialist',
  },
  {
    key: 'Demand Gen & Growth Marketing',
    label: 'Demand Gen & Growth Marketing',
    headline: 'Demand Generation & Growth Marketing Specialist',
  },
  {
    key: 'RevOps, Strategy & Management',
    label: 'RevOps, Strategy & Management',
    headline: 'Revenue Operations & Growth Systems Specialist',
  },
] as const;

type DomainKey = (typeof DOMAIN_OPTIONS)[number]['key'];
type PresetDomainKey = Exclude<DomainKey, typeof DEFAULT_DOMAIN_KEY>;

const DOMAIN_ROLE_PLANS: Record<PresetDomainKey, string[]> = {
  FullStack: [
    'Web Developer',
    'Full Stack Engineer',
    'Senior Software Engineer',
    'Senior Software Engineer',
  ],
  'AI Integration': [
    'Software Engineer',
    'Full Stack Engineer',
    'Senior Software Engineer',
    'Senior Software Engineer (AI Integration)',
  ],
  'Applied AI': [
    'Web Developer',
    'Full Stack Engineer',
    'Senior Software Developer',
    'Senior Software Engineer (Applied AI & Full Stack)',
  ],
  'AI/ML': [
    'Data Engineer',
    'Machine Learning Engineer',
    'Senior Machine Learning Engineer',
    'Senior AI/ML Engineer',
  ],
  DevOps: [
    'Software Engineer',
    'Platform Engineer',
    'Senior DevOps Engineer',
    'Senior DevOps Engineer',
  ],
  Data: [
    'Backend Engineer',
    'Data Engineer',
    'Senior Data Engineer',
    'Senior Data Engineer',
  ],
  Salesforce: [
    'Salesforce Developer/Admin',
    'Salesforce Developer',
    'Senior Salesforce Developer',
    'Salesforce Technical Architect',
  ],
  Solutions: [
    'Software Engineer',
    'Software Engineer',
    'Senior Software Engineer',
    'Senior Solutions Engineer',
  ],
  QA: [
    'QA Tester',
    'QA Engineer',
    'Senior QA Engineer',
    'Senior QA Automation Engineer',
  ],
  'SDR & Outbound Sales': [
    'Lead Generation Associate',
    'Sales Development Representative (SDR)',
    'Business Development Representative (BDR)',
    'B2B Lead Generation & Sales Development Consultant',
  ],
  'Demand Gen & Growth Marketing': [
    'Marketing & Lead Generation Coordinator',
    'Growth Marketing Specialist',
    'Demand Generation Specialist - SaaS & B2B Growth',
    'Growth & Demand Generation Consultant',
  ],
  'RevOps, Strategy & Management': [
    'Sales Operations Associate',
    'Sales Operations & CRM Specialist',
    'Revenue Operations Specialist',
    'Lead Generation & Revenue Operations Consultant',
  ],
};

function rolePlanTitlesFromResumeText(resumeText: string): string[] {
  const titles = extractRoleTitlesFromProfile(resumeText);
  const list = titles.length > 0 ? titles : ['Software Engineer'];
  // Resume text lists roles newest-first; preset domains use chronological order (earliest → latest).
  return [...list].reverse();
}

function rolePlanJsonFromResumeText(resumeText: string): string {
  return JSON.stringify(rolePlanTitlesFromResumeText(resumeText), null, 2);
}

function rolePlanJsonForDomain(domain: DomainKey, resumeText?: string): string {
  if (domain === DEFAULT_DOMAIN_KEY) {
    return rolePlanJsonFromResumeText(resumeText ?? '');
  }
  return JSON.stringify(DOMAIN_ROLE_PLANS[domain], null, 2);
}

function headlineForDomain(domain: DomainKey, profile?: BaseResumeProfile): string {
  if (domain === DEFAULT_DOMAIN_KEY) {
    const fromTarget = profile?.targetTitle?.trim();
    if (fromTarget) return fromTarget;
    const firstLine = profile?.resumeText
      ?.split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
    return firstLine ?? 'Senior Software Engineer';
  }
  const option = DOMAIN_OPTIONS.find((o) => o.key === domain);
  return option && 'headline' in option ? option.headline : 'Senior Software Engineer';
}

function parseRolePlanJson(rawRolePlanJson: string): string[] | null {
  const raw = rawRolePlanJson.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const roles = parsed
      .map((r) => (typeof r === 'string' ? r.trim() : ''))
      .filter(Boolean);
    if (roles.length === 0) {
      return null;
    }
    return roles;
  } catch {
    return null;
  }
}

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [baseResumes, setBaseResumes] = useState<BaseResumeProfile[]>([]);
  const [selectedProfileName, setSelectedProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [jobDescriptionForPrompt, setJobDescriptionForPrompt] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<DomainKey>(DEFAULT_DOMAIN_KEY);
  const [rolePlanJson, setRolePlanJson] = useState('[]');
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptCopyMessage, setPromptCopyMessage] = useState('Copied to clipboard');
  const [stageError, setStageError] = useState('');
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | 'address' | 'linkedin' | null>(null);

  const effectiveProfileName = selectedProfileName || baseResumes[0]?.name;
  const selectedProfile = baseResumes.find((p) => p.name === effectiveProfileName);

  const handleCopyContact = async (field: 'email' | 'phone' | 'address' | 'linkedin', value: string | undefined) => {
    const text = value?.trim() || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch('/api/profiles');
        const data = await response.json();
        if (data.profiles) {
          setBaseResumes(data.profiles);
          if (data.profiles.length > 0 && !selectedProfileName) {
            setSelectedProfileName(data.profiles[0].name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedDomain !== DEFAULT_DOMAIN_KEY || !selectedProfile?.resumeText) return;
    setRolePlanJson(rolePlanJsonFromResumeText(selectedProfile.resumeText));
  }, [selectedDomain, selectedProfile?.name, selectedProfile?.resumeText]);

  const copyPromptToClipboard = async (promptText: string, copiedMessage: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setPromptCopyMessage(copiedMessage);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      setPromptCopied(false);
    }
  };

  const buildSelectedDomainStage1Output = (): Stage1Output | null => {
    const roleTitles = parseRolePlanJson(rolePlanJson);
    if (!roleTitles) {
      setStageError(
        'Role Plan JSON must be a non-empty JSON array of title strings, e.g. ["Software Engineer","Senior Software Engineer"].'
      );
      return null;
    }
    setStageError('');
    return {
      domain:
        selectedDomain === DEFAULT_DOMAIN_KEY
          ? selectedProfile?.industry?.trim() || 'Default'
          : selectedDomain,
      headline: headlineForDomain(selectedDomain, selectedProfile),
      seniority: 'Senior',
      roles: [],
    };
  };

  /** Builds the markdown resume prompt (formerly “stage 3” in code / DB: customStage3Prompt). */
  const handleGenerateMarkdownPrompt = async () => {
    const profileData = selectedProfile?.resumeText?.trim() || '[Paste profile/resume data here]';
    const stage1Output = buildSelectedDomainStage1Output();
    if (!stage1Output) return;
    const stage2Output: Stage2Output = {
      roles: parseRolePlanJson(rolePlanJson) ?? [],
    };
    const jobDesc = jobDescriptionForPrompt.trim() || '[Paste job description here]';
    const promptText = buildStage3Prompt(
      profileData,
      jobDesc,
      stage1Output,
      stage2Output,
      selectedProfile?.customStage3Prompt,
      selectedProfile?.targetTitle
    );
    await copyPromptToClipboard(promptText, 'Stage 2 prompt copied');
  };

  const handleGenerateQaPrompt = async () => {
    await copyPromptToClipboard(QA_PROMPT_TEMPLATE, 'QA prompt copied');
  };

  const inputClass =
    'w-full bg-white border border-zinc-300 rounded-md px-3 py-1.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400';
  const labelClass = 'block text-zinc-600 text-sm font-medium mb-1';

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-4 px-4">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-semibold text-zinc-900 mb-3">Dynamic Resume PDF</h1>
        <form
          ref={formRef}
          action="/api/generate-dynamic-resume-pdf"
          method="POST"
          encType="multipart/form-data"
          target="_blank"
          className="space-y-3"
        >
          <div>
            <label className={labelClass}>Base Resume Profile</label>
            <select
              name="base_resume_profile"
              value={selectedProfileName || baseResumes[0]?.name || ''}
              onChange={(e) => {
                const name = e.target.value;
                setSelectedProfileName(name);
                if (selectedDomain === DEFAULT_DOMAIN_KEY) {
                  const profile = baseResumes.find((p) => p.name === name);
                  if (profile?.resumeText) {
                    setRolePlanJson(rolePlanJsonFromResumeText(profile.resumeText));
                  }
                }
              }}
              className={inputClass}
            >
              {baseResumes.map((p) => (
                <option key={p.name} value={p.name} className="bg-white text-zinc-900">
                  {p.industry ? `${p.name} - ${p.industry}` : p.name}
                </option>
              ))}
            </select>
            {selectedProfile && (selectedProfile.industry || selectedProfile.email || selectedProfile.phoneNumber || selectedProfile.fullAddress || selectedProfile.linkedinUrl) && (
              <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                {selectedProfile.industry && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium py-1 px-2 rounded-md border bg-blue-50 text-blue-700 border-blue-200">
                    Industry: {selectedProfile.industry}
                  </span>
                )}
                {selectedProfile.email && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact('email', selectedProfile.email)}
                    className={`inline-flex items-center gap-1 text-xs font-medium py-1 px-2 rounded-md border ${btnMotion} ${copiedField === 'email' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:border-zinc-400'}`}
                  >
                    {copiedField === 'email' ? <Check className="size-3.5 shrink-0" /> : <Mail className="size-3.5 shrink-0" />}
                    {copiedField === 'email' ? 'Copied' : 'Email'}
                  </button>
                )}
                {selectedProfile.phoneNumber && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact('phone', selectedProfile.phoneNumber)}
                    className={`inline-flex items-center gap-1 text-xs font-medium py-1 px-2 rounded-md border ${btnMotion} ${copiedField === 'phone' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:border-zinc-400'}`}
                  >
                    {copiedField === 'phone' ? <Check className="size-3.5 shrink-0" /> : <Phone className="size-3.5 shrink-0" />}
                    {copiedField === 'phone' ? 'Copied' : 'Phone'}
                  </button>
                )}
                {selectedProfile.fullAddress && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact('address', selectedProfile.fullAddress)}
                    className={`inline-flex items-center gap-1 text-xs font-medium py-1 px-2 rounded-md border ${btnMotion} ${copiedField === 'address' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:border-zinc-400'}`}
                  >
                    {copiedField === 'address' ? <Check className="size-3.5 shrink-0" /> : <MapPin className="size-3.5 shrink-0" />}
                    {copiedField === 'address' ? 'Copied' : 'Address'}
                  </button>
                )}
                {selectedProfile.linkedinUrl && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact('linkedin', selectedProfile.linkedinUrl)}
                    className={`inline-flex items-center gap-1 text-xs font-medium py-1 px-2 rounded-md border ${btnMotion} ${copiedField === 'linkedin' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:border-zinc-400'}`}
                  >
                    {copiedField === 'linkedin' ? <Check className="size-3.5 shrink-0" /> : <Linkedin className="size-3.5 shrink-0" />}
                    {copiedField === 'linkedin' ? 'Copied' : 'LinkedIn'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Job description</label>
            <textarea
              value={jobDescriptionForPrompt}
              onChange={(e) => setJobDescriptionForPrompt(e.target.value)}
              rows={2}
              placeholder="Paste job description to build prompt…"
              className={`${inputClass} resize-none`}
            />
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateMarkdownPrompt}
                className={`inline-flex items-center gap-1.5 text-sm font-medium bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-md py-1.5 px-3 hover:bg-zinc-300 hover:border-zinc-400 ${btnMotion}`}
              >
                <Sparkles className="size-4 shrink-0" />
                Stage 2 prompt
              </button>
              <button
                type="button"
                onClick={handleGenerateQaPrompt}
                className={`inline-flex items-center gap-1.5 text-sm font-medium bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-md py-1.5 px-3 hover:bg-zinc-300 hover:border-zinc-400 ${btnMotion}`}
              >
                <Sparkles className="size-4 shrink-0" />
                QA prompt
              </button>
              {promptCopied && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md py-1 px-2 animate-copy-in">
                  <Check className="size-3.5 shrink-0" />
                  {promptCopyMessage}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Domain</label>
            <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-2.5 shadow-sm">
              <select
                value={selectedDomain}
                onChange={(e) => {
                  const nextDomain = e.target.value as DomainKey;
                  setSelectedDomain(nextDomain);
                  setRolePlanJson(
                    rolePlanJsonForDomain(nextDomain, selectedProfile?.resumeText)
                  );
                  setStageError('');
                }}
                className={inputClass}
              >
                {DOMAIN_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key} className="bg-white text-zinc-900">
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                Default uses role titles from the profile&apos;s resume text. Other domains load preset title lists.
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Role Plan JSON</label>
            <textarea
              value={rolePlanJson}
              onChange={(e) => setRolePlanJson(e.target.value)}
              rows={4}
              placeholder='["Software Engineer","Senior Software Engineer"]'
              className={`${inputClass} resize-none font-mono text-sm`}
            />
            {stageError && (
              <p className="mt-1 text-xs text-red-600">{stageError}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Resume text</label>
            <textarea
              name="job_description"
              required
              rows={4}
              cols={60}
              placeholder="Tailored resume text…"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Company</label>
              <input name="company" placeholder="Company" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <input name="role" placeholder="Role" className={inputClass} />
            </div>
          </div>

          <input type="hidden" name="jd_text" value={jobDescriptionForPrompt} />

          <button
            type="submit"
            className={`w-full inline-flex items-center justify-center gap-2 bg-zinc-900 text-white font-medium py-2 rounded-md hover:bg-zinc-800 border-2 border-zinc-900 hover:border-zinc-800 shadow-sm ${btnMotion}`}
          >
            <FileDown className="size-4 shrink-0" />
            Generate PDF
          </button>
        </form>
      </div>
    </main>
  );
}