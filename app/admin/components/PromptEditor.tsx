'use client';
import { useState, useEffect } from 'react';
import { DEFAULT_PROMPT_TEMPLATE } from '@/app/utils/promptBuilder';
import { BaseResumeProfile } from '@/app/data/baseResumes';

interface PromptEditorProps {
  profiles: BaseResumeProfile[];
  selectedProfile: string | null;
  onProfileSelect: (name: string) => void;
  onUpdate: () => void;
}

export default function PromptEditor({
  profiles,
  selectedProfile,
  onProfileSelect,
  onUpdate
}: PromptEditorProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (selectedProfile) {
      const profile = profiles.find(p => p.name === selectedProfile);
      if (profile) {
        if (profile.customPrompt) {
          setCustomPrompt(profile.customPrompt);
          setDefaultPrompt('');
        } else {
          setDefaultPrompt(DEFAULT_PROMPT_TEMPLATE);
          setCustomPrompt('');
        }
      }
    } else {
      setCustomPrompt('');
      setDefaultPrompt('');
    }
  }, [selectedProfile, profiles]);

  const handleSave = async () => {
    if (!selectedProfile) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const profile = profiles.find(p => p.name === selectedProfile);
      if (!profile) {
        setError('Profile not found');
        return;
      }

      // Determine if we're saving a custom prompt or clearing it
      const promptToSave = customPrompt.trim();
      const isDefaultPrompt = !promptToSave || promptToSave === defaultPrompt;
      
      const response = await fetch('/api/admin/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: profile.name,
          name: profile.name,
          resumeText: profile.resumeText,
          customPrompt: isDefaultPrompt ? undefined : promptToSave,
          pdfTemplate: profile.pdfTemplate ?? 1,
          email: profile.email,
          phoneNumber: profile.phoneNumber,
          fullAddress: profile.fullAddress,
          linkedinUrl: profile.linkedinUrl,
          jobDescription: profile.jobDescription ?? null,
          targetTitle: profile.targetTitle ?? null,
          logGenerations: profile.logGenerations ?? false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isDefaultPrompt) {
          setSuccess('Custom prompt cleared! Using default prompt.');
        } else {
          setSuccess('Prompt saved successfully!');
        }
        setTimeout(() => setSuccess(''), 3000);
        onUpdate();
      } else {
        setError(data.error || 'Failed to save prompt');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (selectedProfile) {
      const profile = profiles.find(p => p.name === selectedProfile);
      if (profile) {
        setDefaultPrompt(DEFAULT_PROMPT_TEMPLATE);
        setCustomPrompt('');
      }
    }
  };

  const selectedProfileData = profiles.find(p => p.name === selectedProfile);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Custom Prompt Editor</h2>

        {/* Profile Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Profile
          </label>
          <select
            value={selectedProfile || ''}
            onChange={(e) => onProfileSelect(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {profiles.map((profile) => (
              <option key={profile.name} value={profile.name}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProfileData && (
          <>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is the same prompt used by the &quot;Generate Prompt with Job Description&quot; button on the main page.
                Use <code className="bg-blue-100 px-1 rounded">{"${profileData}"}</code> for profile/resume data,{' '}
                <code className="bg-blue-100 px-1 rounded">{"${jobDescription}"}</code> for the job description, and{' '}
                <code className="bg-blue-100 px-1 rounded">{"${targetTitle}"}</code> for the target title from the profile.
              </p>
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

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Custom Prompt
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
              <textarea
                value={customPrompt || defaultPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  if (defaultPrompt && e.target.value !== defaultPrompt) {
                    // User is editing, clear default
                    setDefaultPrompt('');
                  }
                }}
                rows={20}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter custom prompt here..."
              />
              <p className="mt-2 text-xs text-gray-500">
                {(customPrompt || defaultPrompt).length} characters
                {selectedProfileData.customPrompt && (
                  <span className="ml-2 text-blue-600">• Custom prompt is active</span>
                )}
                {!selectedProfileData.customPrompt && customPrompt && (
                  <span className="ml-2 text-yellow-600">• Unsaved custom prompt</span>
                )}
              </p>
            </div>

            {!selectedProfileData.customPrompt && !customPrompt && defaultPrompt && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Using default prompt.</strong> Edit the text above to create a custom prompt for this profile.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Prompt'}
              </button>
               {selectedProfileData.customPrompt && (
                 <button
                   onClick={async () => {
                     setCustomPrompt('');
                     setDefaultPrompt(DEFAULT_PROMPT_TEMPLATE);
                     // Save with undefined customPrompt to clear it
                     const response = await fetch('/api/admin/profiles', {
                       method: 'PUT',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                         oldName: selectedProfileData.name,
                         name: selectedProfileData.name,
                         resumeText: selectedProfileData.resumeText,
                         customPrompt: undefined,
                         pdfTemplate: selectedProfileData.pdfTemplate ?? 1,
                         email: selectedProfileData.email,
                         phoneNumber: selectedProfileData.phoneNumber,
                         fullAddress: selectedProfileData.fullAddress,
                         linkedinUrl: selectedProfileData.linkedinUrl,
                         jobDescription: selectedProfileData.jobDescription ?? null,
                         targetTitle: selectedProfileData.targetTitle ?? null,
                         logGenerations: selectedProfileData.logGenerations ?? false,
                       }),
                     });
                     if (response.ok) {
                       setSuccess('Custom prompt cleared!');
                       setTimeout(() => setSuccess(''), 3000);
                       onUpdate();
                     }
                   }}
                   disabled={saving}
                   className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                 >
                   Clear Custom Prompt
                 </button>
               )}
            </div>
          </>
        )}

        {!selectedProfileData && (
          <div className="text-center py-8 text-gray-600">
            Please select a profile to edit its prompt
          </div>
        )}
      </div>
    </div>
  );
}

