'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_STAGE1_PROMPT_TEMPLATE,
  DEFAULT_STAGE3_PROMPT_TEMPLATE,
  DEFAULT_RESUME_PROMPT_TEMPLATE,
  QA_PROMPT_TEMPLATE,
  COVER_LETTER_PROMPT_TEMPLATE,
} from '@/app/utils/promptBuilder';
import type { DefaultPrompts } from '@/lib/defaultPrompts';

type PromptKey = 'stage1Prompt' | 'stage2Prompt' | 'resumePrompt' | 'qaPrompt' | 'coverLetterPrompt';

const PROMPT_TABS: { key: PromptKey; label: string }[] = [
  { key: 'stage1Prompt', label: 'Stage 1 Prompt' },
  { key: 'stage2Prompt', label: 'Stage 2 Prompt' },
  { key: 'resumePrompt', label: 'Resume Prompt' },
  { key: 'qaPrompt', label: 'QA Prompt' },
  { key: 'coverLetterPrompt', label: 'Cover Letter Prompt' },
];

const CODE_DEFAULTS: DefaultPrompts = {
  stage1Prompt: DEFAULT_STAGE1_PROMPT_TEMPLATE,
  stage2Prompt: DEFAULT_STAGE3_PROMPT_TEMPLATE,
  qaPrompt: QA_PROMPT_TEMPLATE,
  coverLetterPrompt: COVER_LETTER_PROMPT_TEMPLATE,
  resumePrompt: DEFAULT_RESUME_PROMPT_TEMPLATE,
};

const PLACEHOLDER_NOTES: Record<PromptKey, string> = {
  stage1Prompt:
    'Placeholders: ${profileData}, ${jobDescription}, ${targetTitle}, ${baseResume}',
  stage2Prompt:
    'Placeholders: ${profileData}, ${jobDescription}, ${plannerOutput}, ${domain}, ${headline}, ${roles}, ${experienceCount}, ${targetTitle}',
  resumePrompt:
    '1-stage Resume Prompt. Placeholders: ${profileData}, ${jobDescription}, ${plannerOutput}, ${domain}, ${headline}, ${roles}, ${experienceCount}, ${targetTitle}',
  qaPrompt: 'Shared QA prompt copied by the main page QA button.',
  coverLetterPrompt:
    'Placeholders: ${Submission_Type} (Manual_Text_Input or PDF_Document). Copied by the main page Cover letter prompt button.',
};

interface DefaultPromptEditorProps {
  onUpdate?: () => void;
}

export default function DefaultPromptEditor({ onUpdate }: DefaultPromptEditorProps) {
  const [activePrompt, setActivePrompt] = useState<PromptKey>('stage1Prompt');
  const [prompts, setPrompts] = useState<DefaultPrompts>(CODE_DEFAULTS);
  const [draftPrompts, setDraftPrompts] = useState<DefaultPrompts>(CODE_DEFAULTS);
  const [overrides, setOverrides] = useState<Record<PromptKey, boolean>>({
    stage1Prompt: false,
    stage2Prompt: false,
    resumePrompt: false,
    qaPrompt: false,
    coverLetterPrompt: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPrompts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/default-prompts', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load default prompts');
        return;
      }

      setPrompts(data.prompts);
      setDraftPrompts(data.prompts);
      setOverrides({
        stage1Prompt: !!data.overrides?.stage1Prompt,
        stage2Prompt: !!data.overrides?.stage2Prompt,
        resumePrompt: !!data.overrides?.resumePrompt,
        qaPrompt: !!data.overrides?.qaPrompt,
        coverLetterPrompt: !!data.overrides?.coverLetterPrompt,
      });
    } catch {
      setError('Failed to load default prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const hasChanges = PROMPT_TABS.some(({ key }) => draftPrompts[key] !== prompts[key]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/default-prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(draftPrompts),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save default prompts');
        return;
      }

      setPrompts(data.prompts);
      setDraftPrompts(data.prompts);
      setOverrides({
        stage1Prompt: !!data.overrides?.stage1Prompt,
        stage2Prompt: !!data.overrides?.stage2Prompt,
        resumePrompt: !!data.overrides?.resumePrompt,
        qaPrompt: !!data.overrides?.qaPrompt,
        coverLetterPrompt: !!data.overrides?.coverLetterPrompt,
      });
      setSuccess('Default prompts saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
      onUpdate?.();
    } catch {
      setError('Failed to save default prompts');
    } finally {
      setSaving(false);
    }
  };

  const handleResetActive = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/default-prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [activePrompt]: null }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset prompt');
        return;
      }

      setPrompts(data.prompts);
      setDraftPrompts(data.prompts);
      setOverrides({
        stage1Prompt: !!data.overrides?.stage1Prompt,
        stage2Prompt: !!data.overrides?.stage2Prompt,
        resumePrompt: !!data.overrides?.resumePrompt,
        qaPrompt: !!data.overrides?.qaPrompt,
        coverLetterPrompt: !!data.overrides?.coverLetterPrompt,
      });
      setSuccess('Prompt reset to built-in default.');
      setTimeout(() => setSuccess(''), 3000);
      onUpdate?.();
    } catch {
      setError('Failed to reset prompt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="mt-4 text-gray-600">Loading default prompts...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Default Prompt Editor</h2>
          <p className="text-sm text-gray-600 mt-1">
            Edit the global default prompts used by the main page when a profile has no custom override.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {PROMPT_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActivePrompt(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePrompt === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
            {overrides[key] && (
              <span className="ml-2 text-xs opacity-80">(customized)</span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>{PROMPT_TABS.find((tab) => tab.key === activePrompt)?.label}:</strong>{' '}
          {PLACEHOLDER_NOTES[activePrompt]}
        </p>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {PROMPT_TABS.find((tab) => tab.key === activePrompt)?.label}
          </label>
          <button
            type="button"
            onClick={handleResetActive}
            disabled={saving}
            className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50"
          >
            Reset to built-in default
          </button>
        </div>
        <textarea
          value={draftPrompts[activePrompt]}
          onChange={(e) =>
            setDraftPrompts((current) => ({
              ...current,
              [activePrompt]: e.target.value,
            }))
          }
          rows={activePrompt === 'qaPrompt' || activePrompt === 'coverLetterPrompt' ? 12 : 20}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-900"
        />
        <p className="mt-2 text-xs text-gray-500">
          {draftPrompts[activePrompt].length} characters
          {overrides[activePrompt] ? (
            <span className="ml-2 text-blue-600">• Custom default is active</span>
          ) : (
            <span className="ml-2 text-gray-500">• Using built-in default</span>
          )}
          {draftPrompts[activePrompt] !== prompts[activePrompt] && (
            <span className="ml-2 text-yellow-600">• Unsaved changes</span>
          )}
        </p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Default Prompts'}
        </button>
        <button
          type="button"
          onClick={() => setDraftPrompts(prompts)}
          disabled={saving || !hasChanges}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-semibold rounded-lg transition-colors"
        >
          Discard Changes
        </button>
      </div>
    </div>
  );
}
