import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status && status !== 'ALL' ? { status } : {}

    const bookings = await db.booking.findMany({
      where,
      include: {
        user: true,
        locker: {
          include: { room: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json({ error: 'فشل في تحميل الحجوزات' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, studentId, phone, lockerId, date, timeSlot } = body

    if (!name || !lockerId || !date || !timeSlot) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    // Check if locker is available
    const locker = await db.locker.findUnique({ where: { id: lockerId } })
    if (!locker) {
      return NextResponse.json({ error: 'اللوكر غير موجود' }, { status: 404 })
    }
    if (locker.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'اللوكر غير متاح للحجز' }, { status: 400 })
    }

    // Check for existing booking on same locker, date, timeSlot
    const existingBooking = await db.booking.findFirst({
      where: { lockerId, date, timeSlot, status: { in: ['PENDING', 'CONFIRMED'] } }
    })
    if (existingBooking) {
      return NextResponse.json({ error: 'اللوكر محجوز بالفعل في هذا الوقت' }, { status: 400 })
    }

    // Find or create user
    let user = await db.user.findFirst({
      where: { studentId: studentId || undefined }
    })

    if (!user) {
      user = await db.user.create({
        data: { name, studentId: studentId || null, phone: phone || null }
      })
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        userId: user.id,
        lockerId,
        date,
        timeSlot,
        status: 'CONFIRMED'
      },
      include: {
        user: true,
        locker: { include: { room: true } }
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'فشل في إنشاء الحجز' }, { status: 500 })
  }
}
