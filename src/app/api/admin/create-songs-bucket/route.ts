import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL in server environment' },
      { status: 500 }
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Attempt to create a public bucket named 'songs'. If it already exists, Supabase
    // will typically return an error; we try to detect that and respond gracefully.
    const { data, error } = await admin.storage.createBucket('songs', { public: true });

    if (error) {
      // If bucket exists, Supabase returns 409; surface the message to the caller.
      return NextResponse.json({ error: error.message || error }, { status: 400 });
    }

    return NextResponse.json({ success: true, bucket: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: (err && err.message) || String(err) }, { status: 500 });
  }
}
