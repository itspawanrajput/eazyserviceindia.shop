import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'eazyservice-default-secret-change-me';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export function validateCredentials(username: string, password: string): boolean {
    return username === ADMIN_USER && password === ADMIN_PASSWORD;
}

export function createToken(username: string): string {
    return jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { username: string; role: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { username: string; role: string };
    } catch {
        return null;
    }
}

export async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return false;
    return verifyToken(token) !== null;
}
