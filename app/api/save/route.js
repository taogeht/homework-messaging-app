// app/api/save/route.js
import { createClient } from 'webdav';
import { Buffer } from 'buffer';

// Create WebDAV client
const client = createClient(
  process.env.NEXTCLOUD_URL, // e.g., "https://your-nextcloud-server.com/remote.php/webdav/"
  {
    username: process.env.NEXTCLOUD_USERNAME,
    password: process.env.NEXTCLOUD_PASSWORD
  }
);

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Convert base64 to buffer
    const base64Data = data.audioData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate filename using classroom, student name, and date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA').replace(/-/g, ''); // YYYYMMDD format in local timezone
    const fileName = `${data.classroom || 'class'}-${data.name}-${dateStr}.webm`;
    const remotePath = `/Recordings/${fileName}`;
    
    // Upload to Nextcloud
    await client.putFileContents(remotePath, buffer, {
      contentLength: buffer.length,
      overwrite: true
    });
    
    // Save metadata
    const recording = {
      name: data.name,
      classroom: data.classroom,
      audioFile: fileName,
      nextcloudPath: remotePath,
      timestamp: new Date().toISOString()
    };

    // You might want to store this metadata in a database instead
    const response = await client.putFileContents(
      '/Recordings/metadata.json',
      JSON.stringify(recording),
      { overwrite: true }
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving recording:', error);
    return Response.json({ error: 'Failed to save recording' }, { status: 500 });
  }
}