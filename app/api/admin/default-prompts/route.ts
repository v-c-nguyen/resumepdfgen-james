import { NextRequest, NextResponse } from 'next/server';
import {
  getDefaultPromptSettings,
  updateDefaultPrompts,
  type DefaultPromptOverrides,
} from '@/lib/defaultPrompts';

function isAuthenticated(req: NextRequest): boolean {
  return !!req.cookies.get('admin_session');
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getDefaultPromptSettings();
    return NextResponse.json(settings);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to read default prompts', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<DefaultPromptOverrides>;
    const prompts = await updateDefaultPrompts(body);
    const settings = await getDefaultPromptSettings();

    return NextResponse.json({
      prompts,
      overrides: settings.overrides,
      codeDefaults: settings.codeDefaults,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update default prompts', details: errorMessage },
      { status: 500 }
    );
  }
}
