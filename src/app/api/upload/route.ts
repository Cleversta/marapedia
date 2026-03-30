import { NextRequest, NextResponse } from 'next/server'
import { uploadToR2 } from '@/lib/r2'
import sharp from 'sharp'

const MAX_WIDTH = 1200
const WEBP_QUALITY = 82

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    let finalBuffer: Buffer
    let contentType: string
    let ext: string

    if (file.type === 'image/gif') {
      finalBuffer = buffer
      contentType = 'image/gif'
      ext = 'gif'
    } else {
      finalBuffer = await sharp(buffer)
        .resize(MAX_WIDTH, MAX_WIDTH, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()
      contentType = 'image/webp'
      ext = 'webp'
    }

    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const url = await uploadToR2(finalBuffer, uniqueName, contentType)

    return NextResponse.json({ url })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 })
  }
}