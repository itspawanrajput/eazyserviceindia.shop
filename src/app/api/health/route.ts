import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        cwd: process.cwd(),
        nodeVersion: process.version,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
        },
        dataFileExists: fs.existsSync(path.join(process.cwd(), 'data', 'site-content.json')),
        files: (() => {
            try {
                return fs.readdirSync(process.cwd());
            } catch {
                return ['error reading dir'];
            }
        })(),
    });
}
