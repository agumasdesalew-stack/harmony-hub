import { NextRequest, NextResponse } from 'next/server';

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenResponse.ok) {
    // capture upstream body to help diagnose invalid credentials, rate limits, etc.
    let bodyText: string;
    try {
      bodyText = await tokenResponse.text();
    } catch (e) {
      bodyText = '<unable to read body>';
    }
    console.error('Spotify token endpoint error:', tokenResponse.status, bodyText);
    throw new Error(`Failed to retrieve Spotify access token: ${bodyText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token as string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const trackId = params.id;

  if (!trackId) {
    return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
  }

  try {
    const accessToken = await getSpotifyAccessToken();

    if (!accessToken) {
      // Fallback mock data when credentials are missing (development mode)
      return NextResponse.json({
        id: trackId,
        name: 'Blinding Lights',
        artists: [{ name: 'The Weeknd' }],
        album: {
          name: 'After Hours',
          images: [{ url: '/api/placeholder/400/400' }],
        },
        preview_url: null,
        duration_ms: 200000,
        external_urls: { spotify: `https://open.spotify.com/track/${trackId}` },
      });
    }

    const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (trackResponse.status === 404) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    if (!trackResponse.ok) {
      // surface upstream body for easier debugging (also logged server-side)
      let bodyText: string;
      try {
        bodyText = await trackResponse.text();
      } catch (e) {
        bodyText = '<unable to read body>';
      }
      console.error('Spotify track endpoint error:', trackResponse.status, bodyText);
      throw new Error(`Failed to fetch track details from Spotify: ${bodyText}`);
    }

    const trackData = await trackResponse.json();
    return NextResponse.json(trackData);
  } catch (error) {
    console.error('Spotify track API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load track' },
      { status: 500 }
    );
  }
}


