import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') where.status = status
    if (userId) where.userId = userId

    const bookings = await db.booking.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, studentId: true, phone: true }
        },
        seat: {
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
    const { seatId, date, timeSlot } = body

    // Get token from header
    const authHeader = request.headers.get('Authorization')
    let userId = body.userId

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const payload = verifyToken(token)
      if (payload) {
        userId = payload.userId
      }
    }

    if (!userId || !seatId || !date || !timeSlot) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول وملء جميع الحقول المطلوبة' }, { status: 400 })
    }

    // Check if seat exists and is available
    const seat = await db.seat.findUnique({ where: { id: seatId } })
    if (!seat) {
      return NextResponse.json({ error: 'الواكر غير موجود' }, { status: 404 })
    }
    if (seat.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'الواكر غير متاح للحجز' }, { status: 400 })
    }

    // Check for existing booking on same seat, date, timeSlot
    const existingBooking = await db.booking.findFirst({
      where: { seatId, date, timeSlot, status: { in: ['PENDING', 'CONFIRMED'] } }
    })
    if (existingBooking) {
      return NextResponse.json({ error: 'الواكر محجوز بالفعل في هذا الوقت' }, { status: 400 })
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        userId,
        seatId,
        date,
        timeSlot,
        status: 'CONFIRMED'
      },
      include: {
        user: {
          select: { id: true, name: true, studentId: true, phone: true }
        },
        seat: { include: { room: true } }
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'فشل في إنشاء الحجز' }, { status: 500 })
  }
}
