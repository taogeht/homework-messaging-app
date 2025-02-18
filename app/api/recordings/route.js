// app/api/recordings/route.js
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const dbPath = join(process.cwd(), 'data', 'recordings.json');
    const data = await readFile(dbPath, 'utf8');
    const recordings = JSON.parse(data);
    
    return Response.json(recordings);
  } catch (error) {
    console.error('Error fetching recordings:', error);
    return Response.json([], { status: 500 });
  }
}