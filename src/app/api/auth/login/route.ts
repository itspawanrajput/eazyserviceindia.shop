import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }

        if (!validateCredentials(username, password)) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = createToken(username);

        const response = NextResponse.json({ success: true });
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response;
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
