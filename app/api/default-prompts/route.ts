import { NextResponse } from 'next/server';
import { getDefaultPrompts } from '@/lib/defaultPrompts';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      const { getCodeDefaultPrompts } = await import('@/lib/defaultPrompts');
      return NextResponse.json({ prompts: getCodeDefaultPrompts() });
    }

    const prompts = await getDefaultPrompts();
    return NextResponse.json({ prompts });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to read default prompts', details: errorMessage },
      { status: 500 }
    );
  }
}
