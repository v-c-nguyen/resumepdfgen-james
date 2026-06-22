import { prisma } from '@/lib/prisma';
import {
  DEFAULT_STAGE1_PROMPT_TEMPLATE,
  DEFAULT_STAGE3_PROMPT_TEMPLATE,
  DEFAULT_RESUME_PROMPT_TEMPLATE,
  QA_PROMPT_TEMPLATE,
  COVER_LETTER_PROMPT_TEMPLATE,
} from '@/app/utils/promptBuilder';

export type DefaultPrompts = {
  stage1Prompt: string;
  stage2Prompt: string;
  qaPrompt: string;
  coverLetterPrompt: string;
  resumePrompt: string;
};

export type DefaultPromptOverrides = {
  stage1Prompt: string | null;
  stage2Prompt: string | null;
  qaPrompt: string | null;
  coverLetterPrompt: string | null;
  resumePrompt: string | null;
};

export function getCodeDefaultPrompts(): DefaultPrompts {
  return {
    stage1Prompt: DEFAULT_STAGE1_PROMPT_TEMPLATE,
    stage2Prompt: DEFAULT_STAGE3_PROMPT_TEMPLATE,
    qaPrompt: QA_PROMPT_TEMPLATE,
    coverLetterPrompt: COVER_LETTER_PROMPT_TEMPLATE,
    resumePrompt: DEFAULT_RESUME_PROMPT_TEMPLATE,
  };
}

export function resolveDefaultPrompts(overrides?: Partial<DefaultPromptOverrides> | null): DefaultPrompts {
  const codeDefaults = getCodeDefaultPrompts();
  return {
    stage1Prompt: overrides?.stage1Prompt?.trim() || codeDefaults.stage1Prompt,
    stage2Prompt: overrides?.stage2Prompt?.trim() || codeDefaults.stage2Prompt,
    qaPrompt: overrides?.qaPrompt?.trim() || codeDefaults.qaPrompt,
    coverLetterPrompt: overrides?.coverLetterPrompt?.trim() || codeDefaults.coverLetterPrompt,
    resumePrompt: overrides?.resumePrompt?.trim() || codeDefaults.resumePrompt,
  };
}

export async function getDefaultPrompts(): Promise<DefaultPrompts> {
  const settings = await prisma.defaultPromptSettings.findUnique({
    where: { id: 'default' },
    select: {
      stage1Prompt: true,
      stage2Prompt: true,
      qaPrompt: true,
      coverLetterPrompt: true,
      resumePrompt: true,
    },
  });

  return resolveDefaultPrompts(settings);
}

export async function getDefaultPromptSettings(): Promise<{
  prompts: DefaultPrompts;
  overrides: DefaultPromptOverrides;
  codeDefaults: DefaultPrompts;
}> {
  const codeDefaults = getCodeDefaultPrompts();
  const settings = await prisma.defaultPromptSettings.findUnique({
    where: { id: 'default' },
    select: {
      stage1Prompt: true,
      stage2Prompt: true,
      qaPrompt: true,
      coverLetterPrompt: true,
      resumePrompt: true,
    },
  });

  const overrides: DefaultPromptOverrides = {
    stage1Prompt: settings?.stage1Prompt ?? null,
    stage2Prompt: settings?.stage2Prompt ?? null,
    qaPrompt: settings?.qaPrompt ?? null,
    coverLetterPrompt: settings?.coverLetterPrompt ?? null,
    resumePrompt: settings?.resumePrompt ?? null,
  };

  return {
    prompts: resolveDefaultPrompts(overrides),
    overrides,
    codeDefaults,
  };
}

export async function updateDefaultPrompts(input: Partial<DefaultPromptOverrides>): Promise<DefaultPrompts> {
  const data: Partial<DefaultPromptOverrides> = {};

  if ('stage1Prompt' in input) {
    data.stage1Prompt = input.stage1Prompt?.trim() ? input.stage1Prompt.trim() : null;
  }
  if ('stage2Prompt' in input) {
    data.stage2Prompt = input.stage2Prompt?.trim() ? input.stage2Prompt.trim() : null;
  }
  if ('qaPrompt' in input) {
    data.qaPrompt = input.qaPrompt?.trim() ? input.qaPrompt.trim() : null;
  }
  if ('coverLetterPrompt' in input) {
    data.coverLetterPrompt = input.coverLetterPrompt?.trim() ? input.coverLetterPrompt.trim() : null;
  }
  if ('resumePrompt' in input) {
    data.resumePrompt = input.resumePrompt?.trim() ? input.resumePrompt.trim() : null;
  }

  const settings = await prisma.defaultPromptSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      stage1Prompt: data.stage1Prompt ?? null,
      stage2Prompt: data.stage2Prompt ?? null,
      qaPrompt: data.qaPrompt ?? null,
      coverLetterPrompt: data.coverLetterPrompt ?? null,
      resumePrompt: data.resumePrompt ?? null,
    },
    update: data,
    select: {
      stage1Prompt: true,
      stage2Prompt: true,
      qaPrompt: true,
      coverLetterPrompt: true,
      resumePrompt: true,
    },
  });

  return resolveDefaultPrompts(settings);
}
