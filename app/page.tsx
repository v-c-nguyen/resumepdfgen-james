'use client';
import { useRef, useEffect, useState } from 'react';
import { Copy, Check, Mail, Phone, MapPin, Linkedin, Sparkles, FileDown } from 'lucide-react';
import { BaseResumeProfile } from './data/baseResumes';
import { buildPrompt } from './utils/promptBuilder';

const btnMotion = 'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]';

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [baseResumes, setBaseResumes] = useState<BaseResumeProfile[]>([]);
  const [selectedProfileName, setSelectedProfileName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [jobDescriptionForPrompt, setJobDescriptionForPrompt] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);
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

  const handleGeneratePromptWithJobDescription = async () => {
    const profileData = selectedProfile?.resumeText?.trim() || '[Paste profile/resume data here]';
    const jobDesc = jobDescriptionForPrompt.trim() || '[Paste job description here]';
    const promptText = buildPrompt(
      profileData,
      jobDesc,
      selectedProfile?.customPrompt,
      selectedProfile?.targetTitle
    );
    try {
      await navigator.clipboard.writeText(promptText);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      setPromptCopied(false);
    }
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
                onClick={handleGeneratePromptWithJobDescription}
                className={`inline-flex items-center gap-2 text-sm font-medium bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-md py-2 px-4 hover:bg-zinc-300 hover:border-zinc-400 ${btnMotion}`}
              >
                <Sparkles className="size-4 shrink-0" />
                Generate prompt
              </button>
              {promptCopied && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md py-1.5 px-2.5 animate-copy-in">
                  <Check className="size-3.5 shrink-0" />
                  Copied to clipboard
                </span>
              )}
            </div>
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