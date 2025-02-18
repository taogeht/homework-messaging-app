import { createClient } from 'webdav';

// Create WebDAV client
const client = createClient(
  process.env.NEXTCLOUD_WEBDAV_URL,
  {
    username: process.env.NEXTCLOUD_USERNAME,
    password: process.env.NEXTCLOUD_PASSWORD
  }
);

export async function GET() {
  try {
    console.log('Attempting to fetch from:', process.env.NEXTCLOUD_WEBDAV_URL + '/Recordings');
    
    // Get directory contents from Nextcloud
    const directoryItems = await client.getDirectoryContents('/Recordings');
    
    // Debug log
    console.log('Directory items:', directoryItems);
    
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
    console.error('Error fetching recordings from Nextcloud:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    return Response.json(
      { error: 'Failed to fetch recordings', details: error.message },
      { status: 500 }
    );
  }
} 