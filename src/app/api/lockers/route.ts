import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ error: 'يرجى تحديد المنطقة' }, { status: 400 })
    }

    const lockers = await db.locker.findMany({
      where: { roomId },
      orderBy: [{ row: 'asc' }, { column: 'asc' }]
    })

    return NextResponse.json(lockers)
  } catch (error) {
    return NextResponse.json({ error: 'فشل في تحميل اللواكر' }, { status: 500 })
  }
}
