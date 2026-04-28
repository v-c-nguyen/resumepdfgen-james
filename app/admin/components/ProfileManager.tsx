'use client';
import { useState } from 'react';
import { BaseResumeProfile } from '@/app/data/baseResumes';
import { DEFAULT_RESUME_TEXT_TEMPLATE } from '@/app/data/defaultResumeTemplate';

interface ProfileManagerProps {
  profiles: BaseResumeProfile[];
  onUpdate: () => void;
}

export default function ProfileManager({ profiles, onUpdate }: ProfileManagerProps) {
  const [editingProfile, setEditingProfile] = useState<BaseResumeProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setEditingProfile({
      name: '',
      resumeText: DEFAULT_RESUME_TEXT_TEMPLATE,
      customPrompt: undefined,
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
  };

  const handleEdit = (profile: BaseResumeProfile) => {
    setEditingProfile({ ...profile });
    setIsCreating(false);
    setError('');
  };

  const handleSave = async () => {
    if (!editingProfile) return;

    if (!editingProfile.name.trim() || !editingProfile.resumeText.trim()) {
      setError('Name and Resume Text are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = '/api/admin/profiles';
      const method = isCreating ? 'POST' : 'PUT';
      const body = isCreating
        ? {
            name: editingProfile.name,
            resumeText: editingProfile.resumeText,
            customPrompt: editingProfile.customPrompt || undefined,
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
        setEditingProfile(null);
        setIsCreating(false);
        onUpdate();
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
        onUpdate();
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

  if (editingProfile) {
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume Text *
            </label>
            <textarea
              value={editingProfile.resumeText}
              onChange={(e) => setEditingProfile({ ...editingProfile, resumeText: e.target.value })}
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-900"
              placeholder="Paste the full resume text here..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="log-generations-pm"
              checked={editingProfile.logGenerations ?? false}
              onChange={(e) => setEditingProfile({ ...editingProfile, logGenerations: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="log-generations-pm" className="text-sm font-medium text-gray-700">
              Save job description and resume text when generating PDF (optional)
            </label>
          </div>

          <div className="flex gap-4">
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

  return (
    <div className="space-y-4">
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
                  <p className="text-sm text-gray-600 mb-2">
                    Resume Text: {profile.resumeText.length} characters
                  </p>
                  {profile.customPrompt && (
                    <p className="text-sm text-blue-600 mb-2">
                      ✓ Custom prompt configured
                    </p>
                  )}
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

