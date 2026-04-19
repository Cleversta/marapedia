// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const { slug, secret } = await req.json()

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }
revalidateTag(`article-${slug}`, 'max')  // bust specific article
revalidateTag('article', 'max')           // bust article lists
    return NextResponse.json({ revalidated: true, slug })
  } catch {
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}