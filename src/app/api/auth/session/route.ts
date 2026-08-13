import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
