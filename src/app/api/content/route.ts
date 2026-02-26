import { NextRequest, NextResponse } from 'next/server';
import { getSiteContent, updateSiteContent } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

export async function GET() {
    try {
        const content = getSiteContent();
        return NextResponse.json(content);
    } catch {
        return NextResponse.json({ error: 'Failed to read content' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const token = request.cookies.get('admin_token')?.value;
        if (!token || !verifyToken(token)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updates = await request.json();
        const updated = updateSiteContent(updates);
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}
