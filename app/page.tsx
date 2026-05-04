'use client';
import { useRef, useEffect, useState } from 'react';
import { Copy, Check, Mail, Phone, MapPin, Linkedin, Sparkles, FileDown } from 'lucide-react';
import { BaseResumeProfile } from './data/baseResumes';
import {
  buildStage1Prompt,
  buildStage3Prompt,
  Stage1Output,
} from './utils/promptBuilder';

const btnMotion = 'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]';

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [baseResumes, setBaseResumes] = useState<BaseResumeProfile[]>([]);
  const [selectedProfileName, setSelectedProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [jobDescriptionForPrompt, setJobDescriptionForPrompt] = useState('');
  const [stage1Json, setStage1Json] = useState('');
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

  const parseStage1Json = (): Stage1Output | null => {
    const raw = stage1Json.trim();
    if (!raw) {
      setStageError('Please paste Stage 1 JSON output first.');
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<Stage1Output>;
      const domain = typeof parsed.domain === 'string' ? parsed.domain.trim() : '';
      const headline = typeof parsed.headline === 'string' ? parsed.headline.trim() : '';
      const seniority = typeof parsed.seniority === 'string' ? parsed.seniority.trim() : '';

      if (!domain || !headline || !seniority) {
        setStageError('Stage 1 JSON must include non-empty "domain", "headline", and "seniority".');
        return null;
      }

      if (!Array.isArray(parsed.roles)) {
        setStageError('Stage 1 JSON must include a "roles" array.');
        return null;
      }

      const roles = parsed.roles.map((r) => ({
        original_title: typeof r?.original_title === 'string' ? r.original_title.trim() : '',
        normalized_title: typeof r?.normalized_title === 'string' ? r.normalized_title.trim() : '',
        adapted_title: typeof r?.adapted_title === 'string' ? r.adapted_title.trim() : '',
      }));

      if (roles.some((r) => !r.original_title || !r.normalized_title || !r.adapted_title)) {
        setStageError(
          'Each role must include non-empty "original_title", "normalized_title", and "adapted_title".'
        );
        return null;
      }

      setStageError('');
      return { domain, headline, seniority, roles };
    } catch {
      setStageError('Stage 1 output is not valid JSON.');
      return null;
    }
  };

  const handleGenerateStage1Prompt = async () => {
    const profileData = selectedProfile?.resumeText?.trim() || '[Paste profile/resume data here]';
    const jobDesc = jobDescriptionForPrompt.trim() || '[Paste job description here]';
    const promptText = buildStage1Prompt(
      profileData,
      jobDesc,
      selectedProfile?.customStage1Prompt,
      selectedProfile?.targetTitle
    );
    setStageError('');
    await copyPromptToClipboard(promptText, 'Stage 1 prompt copied');
  };

  /** Builds the markdown resume prompt (formerly “stage 3” in code / DB: customStage3Prompt). */
  const handleGenerateMarkdownPrompt = async () => {
    const stage1Output = parseStage1Json();
    if (!stage1Output) return;

    const profileData = selectedProfile?.resumeText?.trim() || '[Paste profile/resume data here]';
    const jobDesc = jobDescriptionForPrompt.trim() || '[Paste job description here]';
    const promptText = buildStage3Prompt(
      profileData,
      jobDesc,
      stage1Output,
      selectedProfile?.customStage3Prompt,
      selectedProfile?.targetTitle
    );
    await copyPromptToClipboard(promptText, 'Stage 2 prompt copied');
  };

  const inputClass =
    'w-full bg-white border border-zinc-300 rounded-md px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400';
  const labelClass = 'block text-zinc-600 text-sm font-medium mb-1.5';

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-semibold text-zinc-900 mb-6">Dynamic Resume PDF</h1>
        <form
          ref={formRef}
          action="/api/generate-dynamic-resume-pdf"
          method="POST"
          encType="multipart/form-data"
          target="_blank"
          className="space-y-5"
        >
          <div>
            <label className={labelClass}>Base Resume Profile</label>
            <select
              name="base_resume_profile"
              value={selectedProfileName || baseResumes[0]?.name || ''}
              onChange={(e) => setSelectedProfileName(e.target.value)}
              className={inputClass}
            >
              {baseResumes.map((p) => (
                <option key={p.name} value={p.name} className="bg-white text-zinc-900">{p.name}</option>
              ))}
            </select>
            {selectedProfile && (selectedProfile.email || selectedProfile.phoneNumber || selectedProfile.fullAddress || selectedProfile.linkedinUrl) && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-zinc-500">Copy:</span>
                {selectedProfile.email && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact('email', selectedProfile.email)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-2.5 rounded-md border ${btnMotion} ${copiedField === 'email' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:border-zinc-400'}`}
                  >
                    {copiedField === 'email' ? <Check className="size-3.5 shrink-0" /> : <Mail className="size-3.5 shrink-0" />}
                    {copiedField === 'email' ? 'Copied' : 'Email'}
                  </button>
                )}
                {selectedProfile.phoneNumber && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact('phone', selectedProfile.phoneNumber)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-2.5 rounded-md border ${btnMotion} ${copiedField === 'phone' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:border-zinc-400'}`}
                  >
                    {copiedField === 'phone' ? <Check className="size-3.5 shrink-0" /> : <Phone className="size-3.5 shrink-0" />}
                    {copiedField === 'phone' ? 'Copied' : 'Phone'}
                  </button>
                )}
                {selectedProfile.fullAddress && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact('address', selectedProfile.fullAddress)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-2.5 rounded-md border ${btnMotion} ${copiedField === 'address' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:border-zinc-400'}`}
                  >
                    {copiedField === 'address' ? <Check className="size-3.5 shrink-0" /> : <MapPin className="size-3.5 shrink-0" />}
                    {copiedField === 'address' ? 'Copied' : 'Address'}
                  </button>
                )}
                {selectedProfile.linkedinUrl && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact('linkedin', selectedProfile.linkedinUrl)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-2.5 rounded-md border ${btnMotion} ${copiedField === 'linkedin' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200 hover:border-zinc-400'}`}
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
              rows={3}
              placeholder="Paste job description to build prompt…"
              className={`${inputClass} resize-none`}
            />
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateStage1Prompt}
                className={`inline-flex items-center gap-2 text-sm font-medium bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-md py-2 px-4 hover:bg-zinc-300 hover:border-zinc-400 ${btnMotion}`}
              >
                <Sparkles className="size-4 shrink-0" />
                Generate prompt for Stage 1
              </button>
              <button
                type="button"
                onClick={handleGenerateMarkdownPrompt}
                className={`inline-flex items-center gap-2 text-sm font-medium bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-md py-2 px-4 hover:bg-zinc-300 hover:border-zinc-400 ${btnMotion}`}
              >
                <Sparkles className="size-4 shrink-0" />
                Generate prompt for Stage 2 (markdown)
              </button>
              {promptCopied && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md py-1.5 px-2.5 animate-copy-in">
                  <Check className="size-3.5 shrink-0" />
                  {promptCopyMessage}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Stage 1 output JSON</label>
            <textarea
              value={stage1Json}
              onChange={(e) => setStage1Json(e.target.value)}
              rows={6}
              placeholder='{"domain":"...","headline":"...","seniority":"...","roles":[...]}'
              className={`${inputClass} resize-none font-mono text-sm`}
            />
            {stageError && (
              <p className="mt-2 text-xs text-red-600">{stageError}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Resume text</label>
            <textarea
              name="job_description"
              required
              rows={5}
              cols={60}
              placeholder="Tailored resume text…"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            className={`w-full inline-flex items-center justify-center gap-2 bg-zinc-900 text-white font-medium py-2.5 rounded-md hover:bg-zinc-800 border-2 border-zinc-900 hover:border-zinc-800 shadow-sm ${btnMotion}`}
          >
            <FileDown className="size-4 shrink-0" />
            Generate PDF
          </button>
        </form>
      </div>
    </main>
  );
}