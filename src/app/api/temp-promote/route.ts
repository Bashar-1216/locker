import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const email = 'admin@tvtc.gov.sa'
    const updated = await db.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    })
    return NextResponse.json({ message: 'Promoted successfully', name: updated.name })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to promote' }, { status: 500 })
  }
}
