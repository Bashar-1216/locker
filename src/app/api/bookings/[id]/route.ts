import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'حالة الحجز غير صالحة' }, { status: 400 })
    }

    const booking = await db.booking.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, studentId: true, phone: true }
        },
        seat: { include: { room: true } }
      }
    })

    return NextResponse.json(booking)
  } catch (error) {
    return NextResponse.json({ error: 'فشل في تحديث الحجز' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await db.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        user: {
          select: { id: true, name: true, studentId: true, phone: true }
        },
        seat: { include: { room: true } }
      }
    })

    return NextResponse.json(booking)
  } catch (error) {
    return NextResponse.json({ error: 'فشل في إلغاء الحجز' }, { status: 500 })
  }
}
