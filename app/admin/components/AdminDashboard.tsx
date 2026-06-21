'use client';
import { useEffect, useState } from 'react';
import ProfileEditor from './ProfileEditor';
import DefaultPromptEditor from './DefaultPromptEditor';
import { BaseResumeProfile } from '@/app/data/baseResumes';
import {
  DEFAULT_STAGE1_PROMPT_TEMPLATE,
  DEFAULT_STAGE3_PROMPT_TEMPLATE,
  QA_PROMPT_TEMPLATE,
  COVER_LETTER_PROMPT_TEMPLATE,
} from '@/app/utils/promptBuilder';
import type { DefaultPrompts } from '@/lib/defaultPrompts';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = 'profiles' | 'default-prompts';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('profiles');
  const [profiles, setProfiles] = useState<BaseResumeProfile[]>([]);
  const [defaultPrompts, setDefaultPrompts] = useState<DefaultPrompts>({
    stage1Prompt: DEFAULT_STAGE1_PROMPT_TEMPLATE,
    stage2Prompt: DEFAULT_STAGE3_PROMPT_TEMPLATE,
    qaPrompt: QA_PROMPT_TEMPLATE,
    coverLetterPrompt: COVER_LETTER_PROMPT_TEMPLATE,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const [profilesResponse, promptsResponse] = await Promise.all([
        fetch('/api/admin/profiles'),
        fetch('/api/admin/default-prompts', { credentials: 'include' }),
      ]);

      if (profilesResponse.ok) {
        const data = await profilesResponse.json();
        setProfiles(data.profiles);
      }

      if (promptsResponse.ok) {
        const data = await promptsResponse.json();
        setDefaultPrompts(data.prompts);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    loadProfiles();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage Resume Profiles, Prompts & PDF Templates</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profiles'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Profiles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('default-prompts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'default-prompts'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Default Prompts
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : activeTab === 'profiles' ? (
          <ProfileEditor
            profiles={profiles}
            defaultPrompts={defaultPrompts}
            onUpdate={handleProfileUpdate}
          />
        ) : (
          <DefaultPromptEditor onUpdate={handleProfileUpdate} />
        )}
      </div>
    </div>
  );
}

