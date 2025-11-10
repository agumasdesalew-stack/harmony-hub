import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // This will use Spotify Web API
  // For now, return mock data - you'll need to set up Spotify API credentials
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // Return mock data for development
    return NextResponse.json({
      tracks: {
        items: [
          {
            id: '1',
            name: 'Blinding Lights',
            artists: [{ name: 'The Weeknd' }],
            album: {
              name: 'After Hours',
              images: [{ url: '/api/placeholder/300/300', height: 300, width: 300 }],
            },
            preview_url: null,
            duration_ms: 200000,
            external_urls: { spotify: 'https://open.spotify.com/track/1' },
          },
        ],
      },
    });
  }

  try {
    // Get access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Search Spotify
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const searchData = await searchResponse.json();
    return NextResponse.json(searchData);
  } catch (error) {
    console.error('Spotify API error:', error);
    return NextResponse.json({ error: 'Failed to search Spotify' }, { status: 500 });
  }
}

