import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const totalLockers = await db.locker.count()
    const availableLockers = await db.locker.count({ where: { status: 'AVAILABLE' } })
    const occupiedLockers = await db.locker.count({ where: { status: 'OCCUPIED' } })
    const maintenanceLockers = await db.locker.count({ where: { status: 'MAINTENANCE' } })
    const totalRooms = await db.room.count()
    const totalBookings = await db.booking.count()
    const confirmedBookings = await db.booking.count({ where: { status: 'CONFIRMED' } })
    const pendingBookings = await db.booking.count({ where: { status: 'PENDING' } })
    const cancelledBookings = await db.booking.count({ where: { status: 'CANCELLED' } })
    const totalUsers = await db.user.count()

    const occupancyRate = totalLockers > 0 ? Math.round((occupiedLockers / totalLockers) * 100) : 0

    // Daily bookings for the last 7 days
    const today = new Date()
    const dailyBookings = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = await db.booking.count({
        where: { date: dateStr, status: { in: ['PENDING', 'CONFIRMED'] } }
      })
      dailyBookings.push({ date: dateStr, count })
    }

    // Latest 5 bookings
    const latestBookings = await db.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        locker: { include: { room: true } }
      }
    })

    // Bookings by room
    const rooms = await db.room.findMany({
      include: {
        _count: { select: { lockers: true } },
        lockers: {
          include: {
            _count: { select: { bookings: true } }
          }
        }
      }
    })
    const bookingsByRoom = rooms.map(room => ({
      name: room.name,
      bookings: room.lockers.reduce((acc, locker) => acc + locker._count.bookings, 0)
    }))

    return NextResponse.json({
      totalLockers,
      availableLockers,
      occupiedLockers,
      maintenanceLockers,
      totalRooms,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalUsers,
      occupancyRate,
      dailyBookings,
      latestBookings,
      bookingsByRoom
    })
  } catch (error) {
    return NextResponse.json({ error: 'فشل في تحميل الإحصائيات' }, { status: 500 })
  }
}
