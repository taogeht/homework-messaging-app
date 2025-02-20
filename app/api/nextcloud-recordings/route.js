import { createClient } from 'webdav';

// Add dynamic configuration for the API route
export const dynamic = 'force-dynamic'; // Changed to force-dynamic for development
export const revalidate = 0; // No cache

// Add debug logging
console.log('Environment variables:', {
  webdavUrl: process.env.NEXTCLOUD_WEBDAV_URL,
  baseUrl: process.env.NEXTCLOUD_BASE_URL,
  username: process.env.NEXTCLOUD_USERNAME,
  // Don't log the actual password
  hasPassword: !!process.env.NEXTCLOUD_PASSWORD
});

// Create WebDAV client with stored credentials
const client = createClient(
  process.env.NEXTCLOUD_WEBDAV_URL,
  {
    username: process.env.NEXTCLOUD_USERNAME,
    password: process.env.NEXTCLOUD_PASSWORD
  }
);

export async function GET() {
  try {
    console.log('Attempting to fetch from Nextcloud...');
    
    // Test connection first
    const exists = await client.exists('/Recordings');
    if (!exists) {
      console.error('Recordings directory not found');
      return Response.json(
        { error: 'Recordings directory not found' },
        { status: 404 }
      );
    }

    const directoryItems = await client.getDirectoryContents('/Recordings');
    console.log('Retrieved directory items:', directoryItems);
    
    // Transform the WebDAV response into our desired format
    const recordings = directoryItems
      .filter(item => {
        console.log('Processing item:', item);
        return item.type === 'file' && (item.mime.startsWith('audio/') || item.mime === 'video/webm');
      })
      .map(item => ({
        name: item.basename,
        // Extract class name from filename or path if available
        class: item.basename.split('-')[0] || 'Unknown Class',
        url: `${process.env.NEXTCLOUD_BASE_URL}/remote.php/webdav${item.filename}`,
        createdAt: item.lastmod,
        message: item.props?.message || '' // Optional message from properties
      }));

    console.log('Processed recordings:', recordings);
    return Response.json(recordings);
    
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return Response.json(
      { 
        error: 'Failed to fetch recordings',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 