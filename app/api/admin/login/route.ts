import { NextRequest, NextResponse } from 'next/server';

const ADMIN_CREDENTIALS = {
  username: 'Team1',
  password: 'csb-ch-123'
};

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    console.log(username, password)
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Create a simple session token (in production, use proper JWT or session management)
      const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      const response = NextResponse.json({ success: true });
      // Set cookie that expires in 24 hours
      response.cookies.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
      });
      
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

