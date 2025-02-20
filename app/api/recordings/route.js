// app/api/recordings/route.js
import { readFile } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const dbPath = join(process.cwd(), 'data', 'recordings.json');
    const data = await readFile(dbPath, 'utf8');
    const recordings = JSON.parse(data);
    
    return NextResponse.json(recordings);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    );
  }
}