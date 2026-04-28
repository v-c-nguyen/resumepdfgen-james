import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get('admin_session');
  
  if (sessionToken) {
    return NextResponse.json({ authenticated: true });
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

