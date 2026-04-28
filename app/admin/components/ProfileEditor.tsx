'use client';
import { useState, useEffect } from 'react';
import { BaseResumeProfile } from '@/app/data/baseResumes';
import { DEFAULT_RESUME_TEXT_TEMPLATE } from '@/app/data/defaultResumeTemplate';
import { PDF_TEMPLATE_IDS } from '@/app/data/pdfTemplateIds';
import { DEFAULT_PROMPT_TEMPLATE } from '@/app/utils/promptBuilder';

interface ProfileEditorProps {
  profiles: BaseResumeProfile[];
  onUpdate: () => void;
}

interface TemplateOption {
  value: number;
  label: string;
  usageCount?: number;
}

export default function ProfileEditor({ profiles, onUpdate }: ProfileEditorProps) {
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<BaseResumeProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pdfTemplates, setPdfTemplates] = useState<TemplateOption[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch templates on component mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/admin/templates', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
            setPdfTemplates(data.templates);
          } else {
            setPdfTemplates(
              PDF_TEMPLATE_IDS.map((value) => ({ value, label: `Template${value}` }))
            );
          }
        } else {
          console.error('Failed to fetch templates:', response.statusText);
          setPdfTemplates(
            PDF_TEMPLATE_IDS.map((value) => ({ value, label: `Template${value}` }))
          );
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
        setPdfTemplates(
          PDF_TEMPLATE_IDS.map((value) => ({ value, label: `Template${value}` }))
        );
      } finally {
        setTemplatesLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfileName) {
      setSelectedProfileName(profiles[0].name);
    }
  }, [profiles, selectedProfileName]);

  const selectedProfile = profiles.find(p => p.name === selectedProfileName);

  const handleCreate = () => {
    setEditingProfile({
      name: '',
      resumeText: DEFAULT_RESUME_TEXT_TEMPLATE,
      customPrompt: undefined,
      pdfTemplate: pdfTemplates.length > 0 ? pdfTemplates[0].value : 1,
      email: '',
      phoneNumber: '',
      fullAddress: '',
      linkedinUrl: '',
      jobDescription: '',
      targetTitle: '',
      logGenerations: false,
    });
    setIsCreating(true);
    setError('');
    setSelectedProfileName(null);
  };

  const handleEdit = (profile: BaseResumeProfile) => {
    setEditingProfile({ ...profile });
    setIsCreating(false);
    setError('');
    setSelectedProfileName(profile.name);
  };

  const handleSave = async () => {
    if (!editingProfile) return;

    if (!editingProfile.name.trim() || !editingProfile.resumeText.trim()) {
      setError('Name and Resume Text are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = '/api/admin/profiles';
      const method = isCreating ? 'POST' : 'PUT';
      const body = isCreating
        ? {
            name: editingProfile.name,
            resumeText: editingProfile.resumeText,
            customPrompt: editingProfile.customPrompt || undefined,
            pdfTemplate: editingProfile.pdfTemplate || (pdfTemplates.length > 0 ? pdfTemplates[0].value : 1),
            email: editingProfile.email || undefined,
            phoneNumber: editingProfile.phoneNumber || undefined,
            fullAddress: editingProfile.fullAddress || undefined,
            linkedinUrl: editingProfile.linkedinUrl || undefined,
            jobDescription: null,
            targetTitle: editingProfile.targetTitle?.trim() || undefined,
            logGenerations: editingProfile.logGenerations ?? false,
          }
        : {
            oldName: profiles.find(p => p.name === editingProfile.name)?.name || editingProfile.name,
            name: editingProfile.name,
            resumeText: editingProfile.resumeText,
            customPrompt: editingProfile.customPrompt || undefined,
            pdfTemplate: editingProfile.pdfTemplate || (pdfTemplates.length > 0 ? pdfTemplates[0].value : 1),
            email: editingProfile.email || undefined,
            phoneNumber: editingProfile.phoneNumber || undefined,
            fullAddress: editingProfile.fullAddress || undefined,
            linkedinUrl: editingProfile.linkedinUrl || undefined,
            jobDescription: editingProfile.jobDescription || undefined,
            targetTitle: editingProfile.targetTitle?.trim() || undefined,
            logGenerations: editingProfile.logGenerations ?? false,
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
        setEditingProfile(null);
        setIsCreating(false);
        setSelectedProfileName(editingProfile.name);
        onUpdate();
        // Refresh template counts after profile update
        const templatesResponse = await fetch('/api/admin/templates', { credentials: 'include' });
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          if (
            templatesData.templates &&
            Array.isArray(templatesData.templates) &&
            templatesData.templates.length > 0
          ) {
            setPdfTemplates(templatesData.templates);
          } else {
            setPdfTemplates(
              PDF_TEMPLATE_IDS.map((value) => ({ value, label: `Template${value}` }))
            );
          }
        }
      } else {
        setError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/profiles?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteConfirm(null);
        if (selectedProfileName === name) {
          setSelectedProfileName(null);
        }
        onUpdate();
        // Refresh template counts after profile deletion
        const templatesResponse = await fetch('/api/admin/templates', { credentials: 'include' });
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          if (
            templatesData.templates &&
            Array.isArray(templatesData.templates) &&
            templatesData.templates.length > 0
          ) {
            setPdfTemplates(templatesData.templates);
          } else {
            setPdfTemplates(
              PDF_TEMPLATE_IDS.map((value) => ({ value, label: `Template${value}` }))
            );
          }
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If editing, show the edit form
  if (editingProfile) {
    const currentPrompt = editingProfile.customPrompt || DEFAULT_PROMPT_TEMPLATE;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {isCreating ? 'Create New Profile' : 'Edit Profile'}
          </h2>
          <button
            onClick={() => {
              setEditingProfile(null);
              setIsCreating(false);
              setError('');
              setSuccess('');
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

        <div className="space-y-6">
          {/* Profile Basic Info */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Name *
                </label>
                <input
                  type="text"
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingProfile.email ?? ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={editingProfile.phoneNumber ?? ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full address
                </label>
                <input
                  type="text"
                  value={editingProfile.fullAddress ?? ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, fullAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="City, State / Country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={editingProfile.linkedinUrl ?? ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, linkedinUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target title (for prompts)
                </label>
                <input
                  type="text"
                  value={editingProfile.targetTitle ?? ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, targetTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., Senior Software Engineer"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Substituted for <code className="bg-gray-100 px-1 rounded">{"${targetTitle}"}</code> when generating the prompt. Leave empty to use the default in your prompt template.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume Text *
                </label>
                <textarea
                  value={editingProfile.resumeText}
                  onChange={(e) => setEditingProfile({ ...editingProfile, resumeText: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-900"
                  placeholder="Paste the full resume text here..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="log-generations"
                  checked={editingProfile.logGenerations ?? false}
                  onChange={(e) => setEditingProfile({ ...editingProfile, logGenerations: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="log-generations" className="text-sm font-medium text-gray-700">
                  Save job description and resume text when generating PDF (optional)
                </label>
              </div>
            </div>
          </div>

          {/* PDF Template Selection */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">PDF Template</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF Template
              </label>
              <div className="flex gap-2">
                <select
                  value={editingProfile.pdfTemplate || (pdfTemplates.length > 0 ? pdfTemplates[0].value : 1)}
                  onChange={(e) => {
                    const newTemplate = Number(e.target.value);
                    setEditingProfile({ ...editingProfile, pdfTemplate: newTemplate });
                    setShowPreview(false);
                    setPreviewUrl(null);
                  }}
                  disabled={templatesLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {templatesLoading ? (
                    <option value="">Loading templates...</option>
                  ) : pdfTemplates.length > 0 ? (
                    pdfTemplates.map((template) => (
                      <option key={template.value} value={template.value}>
                        {template.label} {template.usageCount !== undefined ? `(${template.usageCount} ${template.usageCount === 1 ? 'profile' : 'profiles'})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value={1}>Template1 (default)</option>
                  )}
                </select>
                <button
                  onClick={async () => {
                    const template = editingProfile.pdfTemplate || (pdfTemplates.length > 0 ? pdfTemplates[0].value : 1);
                    // Clean up old preview URL if exists
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                    setPreviewLoading(true);
                    setShowPreview(true);
                    try {
                      const response = await fetch(`/api/admin/templates/preview?template=${template}`, {
                        credentials: 'include',
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                      } else {
                        setError('Failed to load preview');
                        setShowPreview(false);
                      }
                    } catch (err) {
                      setError('Failed to load preview');
                      setShowPreview(false);
                    } finally {
                      setPreviewLoading(false);
                    }
                  }}
                  disabled={templatesLoading || previewLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
                >
                  {previewLoading ? 'Loading...' : 'Preview'}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Choose the PDF template style for this profile. Click Preview to see how it looks.
              </p>
              {pdfTemplates.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Template Usage:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {pdfTemplates.map((template) => (
                      <div key={template.value} className="text-xs text-gray-600">
                        <span className="font-medium">{template.label}:</span>{' '}
                        <span className="text-gray-500">
                          {template.usageCount !== undefined 
                            ? `${template.usageCount} ${template.usageCount === 1 ? 'profile' : 'profiles'}`
                            : '0 profiles'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Preview Section */}
            {showPreview && (
              <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Template Preview</h4>
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setPreviewUrl(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  {previewLoading ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Generating preview...</p>
                      </div>
                    </div>
                  ) : previewUrl ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <iframe
                        src={previewUrl}
                        className="w-full h-[600px] border-0"
                        title="Template Preview"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Custom Prompt Editor */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Custom Prompt</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingProfile({ ...editingProfile, customPrompt: undefined });
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Reset to Default
                </button>
              </div>
            </div>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Use <code className="bg-blue-100 px-1 rounded">{"${baseResume}"}</code> or{' '}
                <code className="bg-blue-100 px-1 rounded">{"${profileData}"}</code> for resume text,{' '}
                <code className="bg-blue-100 px-1 rounded">{"${jobDescription}"}</code> for the job description, and{' '}
                <code className="bg-blue-100 px-1 rounded">{"${targetTitle}"}</code> for the target title from profile settings.
              </p>
            </div>
            <textarea
              value={currentPrompt}
              onChange={(e) => {
                const newPrompt = e.target.value;
                // If user edits away from default, set as custom
                if (newPrompt !== DEFAULT_PROMPT_TEMPLATE) {
                  setEditingProfile({ ...editingProfile, customPrompt: newPrompt });
                } else {
                  setEditingProfile({ ...editingProfile, customPrompt: undefined });
                }
              }}
              rows={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-900"
              placeholder="Enter custom prompt here..."
            />
            <p className="mt-2 text-xs text-gray-500">
              {currentPrompt.length} characters
              {editingProfile.customPrompt && (
                <span className="ml-2 text-blue-600">• Custom prompt is active</span>
              )}
              {!editingProfile.customPrompt && (
                <span className="ml-2 text-gray-500">• Using default prompt</span>
              )}
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              onClick={() => {
                setEditingProfile(null);
                setIsCreating(false);
                setError('');
                setSuccess('');
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show profile list and selection
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Resume Profiles</h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Profile
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No profiles found. Create your first profile!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <div key={profile.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{profile.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Resume Text: {profile.resumeText.length} characters</p>
                    {profile.customPrompt && (
                      <p className="text-blue-600">✓ Custom prompt configured</p>
                    )}
                    <p>PDF Template: {(() => {
                      const template = pdfTemplates.find(t => t.value === (profile.pdfTemplate || (pdfTemplates.length > 0 ? pdfTemplates[0].value : 1)));
                      const templateLabel = template?.label || `Template${profile.pdfTemplate || 1}`;
                      const usageCount = template?.usageCount;
                      return usageCount !== undefined 
                        ? `${templateLabel} (${usageCount} ${usageCount === 1 ? 'profile' : 'profiles'})`
                        : templateLabel;
                    })()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(profile)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(profile.name)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the profile &quot;{showDeleteConfirm}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

