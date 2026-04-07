import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ error: 'يرجى تحديد القاعة' }, { status: 400 })
    }

    const seats = await db.seat.findMany({
      where: { roomId },
      orderBy: [{ row: 'asc' }, { column: 'asc' }]
    })

    return NextResponse.json(seats)
  } catch (error) {
    return NextResponse.json({ error: 'فشل في تحميل المقاعد' }, { status: 500 })
  }
}
