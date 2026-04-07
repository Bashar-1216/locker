'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Building2, Sofa, CalendarDays, BarChart3, Users, CheckCircle2,
  XCircle, Clock, TrendingUp, Plus, Trash2, RefreshCw, Home,
  Armchair, AlertTriangle, LayoutDashboard, BookOpen, GraduationCap,
  ArrowLeft, Sparkles, Monitor, DoorOpen, Zap, UserCheck, ChevronLeft, Wrench, Box
} from 'lucide-react'

// ====== Types ======
interface Room {
  id: string
  name: string
  description: string | null
  capacity: number
  createdAt: string
  _count: { lockers: number }
}

interface Locker {
  id: string
  lockerNumber: number
  row: number
  column: number
  roomId: string
  status: string
}

interface Booking {
  id: string
  userId: string
  lockerId: string
  date: string
  timeSlot: string
  status: string
  createdAt: string
  updatedAt: string
  user: { id: string; name: string; studentId: string | null; phone: string | null }
  locker: Locker & { room: Room }
}

interface Stats {
  totalLockers: number
  availableLockers: number
  occupiedLockers: number
  maintenanceLockers: number
  totalRooms: number
  totalBookings: number
  confirmedBookings: number
  pendingBookings: number
  cancelledBookings: number
  totalUsers: number
  occupancyRate: number
  dailyBookings: { date: string; count: number }[]
  latestBookings: Booking[]
  bookingsByRoom: { name: string; bookings: number }[]
}

// ====== Constants ======
const PIE_COLORS = ['#10b981', '#ef4444', '#9ca3af']
const BAR_COLOR = '#059669'
const ROOM_PIE_COLORS = ['#059669', '#0d9488', '#14b8a6', '#f59e0b', '#8b5cf6']

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  PENDING: { label: 'قيد الانتظار', variant: 'outline', color: 'text-amber-600 border-amber-300 bg-amber-50' },
  CONFIRMED: { label: 'مؤكد', variant: 'default', color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
  CANCELLED: { label: 'ملغي', variant: 'destructive', color: 'text-red-600 border-red-300 bg-red-50' }
}

const LOCKER_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'متاح',
  OCCUPIED: 'محجوز',
  MAINTENANCE: 'صيانة'
}

const TIME_SLOTS = [
  '08:00 - 09:30',
  '09:30 - 11:00',
  '11:00 - 12:30',
  '13:00 - 14:30'
]

const TABS = [
  { value: 'home', label: 'الرئيسية', icon: Home },
  { value: 'booking', label: 'حجز لوكر', icon: DoorOpen },
  { value: 'my-bookings', label: 'حجوزاتي', icon: CalendarDays },
  { value: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard }
]

const STAT_CARDS = [
  { key: 'totalLockers', label: 'إجمالي اللواكر', icon: Box, gradient: 'from-emerald-500 to-emerald-700', accent: '#059669', accentLight: '#10b981' },
  { key: 'availableLockers', label: 'اللواكر المتاحة', icon: CheckCircle2, gradient: 'from-teal-400 to-teal-600', accent: '#14b8a6', accentLight: '#5eead4' },
  { key: 'occupiedLockers', label: 'اللواكر المحجوزة', icon: XCircle, gradient: 'from-red-400 to-red-600', accent: '#ef4444', accentLight: '#fca5a5' },
  { key: 'occupancyRate', label: 'نسبة الإشغال', icon: TrendingUp, gradient: 'from-amber-400 to-amber-600', accent: '#f59e0b', accentLight: '#fcd34d' }
] as const

const FILTER_TABS = [
  { value: 'ALL', label: 'الكل', color: '' },
  { value: 'CONFIRMED', label: 'مؤكد', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'PENDING', label: 'قيد الانتظار', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'CANCELLED', label: 'ملغي', color: 'text-red-600 bg-red-50 border-red-200' }
]

// ====== Animation Variants ======
const tabVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
}

// ====== Real-time Clock Component ======
function RealTimeClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

  return (
    <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm text-xs font-medium">
      <Clock className="h-3.5 w-3.5 opacity-80" />
      <span>{hours}:{minutes}</span>
      <span className="opacity-60">|</span>
      <span className="opacity-80">{dayNames[time.getDay()]}</span>
      <span className="opacity-60">|</span>
      <span className="opacity-80">{time.getDate()} {monthNames[time.getMonth()]}</span>
    </div>
  )
}

// ====== Status Badge Component ======
function StatusBadge({ status }: { status: string }) {
  const info = STATUS_MAP[status] || STATUS_MAP.PENDING
  return (
    <Badge className={`${info.color} text-xs font-medium`} variant={info.variant}>
      {info.label}
    </Badge>
  )
}

// ====== Empty State Component ======
function EmptyState({ icon: Icon, message, actionLabel, onAction }: {
  icon?: React.ElementType
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  const IconComponent = Icon || Box
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-muted-foreground"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <IconComponent className="h-8 w-8 opacity-40" />
      </div>
      <p className="text-sm font-medium mb-1">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm" className="mt-3 text-emerald-600 border-emerald-300 hover:bg-emerald-50">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

// ====== Custom Tooltip for Charts ======
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ====== Premium Skeleton Loading ======
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="hero-gradient rounded-2xl p-8">
        <div className="relative z-10 space-y-4">
          <Skeleton className="h-8 w-64 bg-white/20" />
          <Skeleton className="h-4 w-96 bg-white/15" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-28 rounded-xl bg-white/20" />
            <Skeleton className="h-10 w-28 rounded-xl bg-white/20" />
            <Skeleton className="h-10 w-28 rounded-xl bg-white/20" />
          </div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function BookingPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stepper skeleton */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
              {i < 3 && <Skeleton className="h-0.5 flex-1 mx-2" />}
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BookingsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ====== MAIN APPLICATION ======
export default function SeatBookingApp() {
  const [activeTab, setActiveTab] = useState('home')

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== HEADER ===== */}
      <header className="header-gradient text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between relative z-10">
            {/* Logo + Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight tracking-tight">نظام حجز اللواكر</h1>
              </div>
            </div>

            {/* Right side: Clock + Portal Button */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex">
                <RealTimeClock />
              </div>
              <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-full px-4 py-2 backdrop-blur-sm transition-all duration-300 border border-white/20 hover:border-white/40 hover:shadow-lg group">
                <GraduationCap className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">بوابة الطالبات</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} dir="rtl">
          {/* ===== TABS LIST ===== */}
          <TabsList className="flex w-full mb-6 h-auto p-1 glass rounded-2xl shadow-sm gap-1 overflow-x-auto">
            {TABS.map((tab, idx) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm flex-1 min-w-0 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-200 transition-all duration-300 font-medium"
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <TabsContent value="home" className="mt-0">
                <HomePage onTabChange={handleTabChange} />
              </TabsContent>
              <TabsContent value="booking" className="mt-0">
                <BookingPage />
              </TabsContent>
              <TabsContent value="my-bookings" className="mt-0">
                <MyBookingsPage />
              </TabsContent>
              <TabsContent value="dashboard" className="mt-0">
                <DashboardPage />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="footer-gradient border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">الجهة التعليمية</span>
            </div>
            <p className="text-center">نظام حجز اللواكر الإلكتروني &copy; {new Date().getFullYear()}</p>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              <span>جميع الحقوق محفوظة</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ====== HOME PAGE ======
function HomePage({ onTabChange }: { onTabChange: (v: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const pieData = stats ? [
    { name: 'متاح', value: stats.availableLockers },
    { name: 'محجوز', value: stats.occupiedLockers },
    { name: 'صيانة', value: stats.maintenanceLockers }
  ].filter(d => d.value > 0) : []

  const barData = stats?.dailyBookings?.map(d => ({ ...d, date: d.date.slice(5) })) || []

  if (loading) return <PageSkeleton />

  if (!stats) {
    return (
      <div className="text-center py-20">
        <EmptyState
          icon={AlertTriangle}
          message="لا توجد بيانات بعد"
          actionLabel="توليد بيانات تجريبية"
          onAction={() => onTabChange('dashboard')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ===== HERO BANNER ===== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="hero-gradient rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        {/* Floating Shapes */}
        <div className="floating-shape" />
        <div className="floating-shape" />
        <div className="floating-shape" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <p className="text-emerald-100 text-sm font-medium">الكلية التقنية</p>
            </div>
          </div>
          <p className="text-emerald-50 text-sm mt-2 leading-relaxed max-w-xl">
            يمكنكِ حجز مقعدكِ بسهولة عبر النظام الإلكتروني. اختر القاعة والتاريخ المناسبين لكِ واستمتعي بتجربة تعليمية مريحة.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              onClick={() => onTabChange('booking')}
              className="bg-white text-emerald-700 hover:bg-white/90 rounded-xl px-5 font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4 ml-2" />
              احجز الآن
            </Button>
            <Button
              onClick={() => onTabChange('my-bookings')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-xl px-5 backdrop-blur-sm transition-all duration-300"
            >
              <CalendarDays className="h-4 w-4 ml-2" />
              عرض الحجوزات
            </Button>
            <Button
              onClick={() => onTabChange('dashboard')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-xl px-5 backdrop-blur-sm transition-all duration-300"
            >
              <LayoutDashboard className="h-4 w-4 ml-2" />
              لوحة التحكم
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ===== STAT CARDS ===== */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {STAT_CARDS.map((card, idx) => {
          const Icon = card.icon
          const rawValue = stats[card.key as keyof Stats]
          const value = typeof rawValue === 'number' && card.key === 'occupancyRate'
            ? `${rawValue}%`
            : String(rawValue)

          const progressPct = card.key === 'occupancyRate'
            ? Number(rawValue)
            : card.key === 'totalLockers'
              ? 100
              : stats.totalLockers > 0
                ? Math.round((Number(rawValue) / stats.totalLockers) * 100)
                : 0

          return (
            <motion.div key={card.key} variants={staggerItem} className="stagger-item" style={{ animationDelay: `${idx * 100}ms` }}>
              <Card
                className="stat-card border-0 rounded-2xl overflow-hidden"
                style={{ '--card-accent': card.accent, '--card-accent-light': card.accentLight } as React.CSSProperties}
              >
                <CardContent className="p-5">
                  {/* Gradient Top Bar */}
                  <div className={`h-1 w-full rounded-full bg-gradient-to-l ${card.gradient} mb-4`} />
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 bg-gradient-to-br ${card.gradient} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                      <p className="text-2xl font-bold counter-value">{value}</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="progress-bar mt-3">
                    <div
                      className={`progress-bar-fill bg-gradient-to-l ${card.gradient}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-0 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 font-bold">
                <div className="p-1.5 rounded-lg bg-emerald-100">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
                توزيع حالة المقاعد
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  لا توجد بيانات للعرض
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart - Daily Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-0 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 font-bold">
                <div className="p-1.5 rounded-lg bg-teal-100">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                </div>
                الحجوزات اليومية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={BAR_COLOR} radius={[6, 6, 0, 0]} name="عدد الحجوزات" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  لا توجد بيانات للعرض
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ===== LATEST BOOKINGS (as cards) ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass-card border-0 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <div className="p-1.5 rounded-lg bg-amber-100">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  أحدث الحجوزات
                </CardTitle>
                <CardDescription className="mt-1">آخر الحجوزات المسجلة في النظام</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTabChange('my-bookings')}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl text-xs"
              >
                عرض الكل
                <ChevronLeft className="h-3 w-3 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.latestBookings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.latestBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`booking-card status-${booking.status.toLowerCase()} glass-card rounded-xl p-4 pr-6`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{booking.user.name}</p>
                          {booking.user.studentId && (
                            <p className="text-[10px] text-muted-foreground">#{booking.user.studentId}</p>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{booking.seat.room.name}</span>
                        <span className="opacity-40">|</span>
                        <Armchair className="h-3 w-3" />
                        <span>مقعد {booking.seat.seatNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        <span>{booking.date}</span>
                        <span className="opacity-40">|</span>
                        <Clock className="h-3 w-3" />
                        <span>{booking.timeSlot}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={CalendarDays} message="لا توجد حجوزات بعد" />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ====== BOOKING PAGE ======
function BookingPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [lockers, setLockers] = useState<Locker[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    phone: '',
    date: '',
    timeSlot: ''
  })

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch('/api/rooms')
        if (res.ok) {
          const data = await res.json()
          setRooms(data)
        }
      } catch (err) {
        console.error('Error fetching rooms:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRooms()
  }, [])

  useEffect(() => {
    async function fetchSeats() {
      if (!selectedRoom) return
      try {
        const res = await fetch(`/api/seats?roomId=${selectedRoom}`)
        if (res.ok) {
          const data = await res.json()
          setLockers(data)
        }
      } catch (err) {
        console.error('Error fetching lockers:', err)
      }
    }
    fetchSeats()
  }, [selectedRoom])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setFormData(prev => ({ ...prev, date: today }))
  }, [])

  const handleLockerClick = (locker: Locker) => {
    if (locker.status !== 'AVAILABLE') return
    setSelectedLocker(locker)
  }

  const handleBooking = async () => {
    if (!selectedLocker || !formData.name || !formData.date || !formData.timeSlot) return
    setBookingLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          studentId: formData.studentId || undefined,
          phone: formData.phone || undefined,
          lockerId: selectedLocker.id,
          date: formData.date,
          timeSlot: formData.timeSlot
        })
      })
      if (res.ok) {
        const booking = await res.json()
        setSuccessMessage(`تم حجز لوكر ${booking.locker.lockerNumber} في ${booking.locker.room.name} بنجاح!`)
        setShowConfirm(false)
        setSelectedLocker(null)
        setCurrentStep(1)
        setFormData({ name: '', studentId: '', phone: '', date: new Date().toISOString().split('T')[0], timeSlot: '' })
        setSelectedRoom('')
        const lockersRes = await fetch(`/api/lockers?roomId=${selectedRoom}`)
        if (lockersRes.ok) setLockers(await lockersRes.json())
      } else {
        const err = await res.json()
        alert(err.error || 'حدث خطأ أثناء الحجز')
      }
    } catch {
      alert('حدث خطأ في الاتصال')
    } finally {
      setBookingLoading(false)
    }
  }

  const canProceedStep1 = formData.name.trim() !== ''
  const canProceedStep2 = selectedRoom !== ''
  const canProceedStep3 = selectedRoom !== '' && lockers.length > 0

  const STEP_LABELS = [
    { num: 1, label: 'بيانات الطالبة', icon: Users },
    { num: 2, label: 'اختيار المنطقة', icon: Building2 },
    { num: 3, label: 'اختيار اللوكر', icon: Box }
  ]

  // Group lockers by row
  const maxRow = lockers.length > 0 ? Math.max(...lockers.map(s => s.row)) : 0
  const lockerGrid: Record<number, Locker[]> = {}
  lockers.forEach(locker => {
    if (!lockerGrid[locker.row]) lockerGrid[locker.row] = []
    lockerGrid[locker.row].push(locker)
  })
  const currentRoom = rooms.find(r => r.id === selectedRoom)

  if (loading) return <BookingPageSkeleton />

  return (
    <div className="space-y-6 pb-24">
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 flex items-center gap-3"
          >
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
            <Button variant="ghost" size="sm" onClick={() => setSuccessMessage(null)} className="mr-auto text-emerald-600 hover:bg-emerald-100">✕</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== STEPPER ===== */}
      <Card className="glass-card border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((step, idx) => {
              const isCompleted = currentStep > step.num
              const isCurrent = currentStep === step.num
              const StepIcon = step.icon
              return (
                <div key={step.num} className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => {
                      if (step.num < currentStep) setCurrentStep(step.num)
                      if (step.num === 2 && isCompleted) setCurrentStep(2)
                    }}
                    className={`flex items-center gap-2.5 ${step.num < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 text-sm font-bold
                      ${isCompleted ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' :
                        isCurrent ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300' :
                        'bg-muted text-muted-foreground'}`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step.num}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs font-semibold ${isCurrent ? 'text-emerald-700' : 'text-muted-foreground'}`}>{step.label}</p>
                    </div>
                  </button>
                  {idx < 2 && (
                    <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all duration-500 ${currentStep > step.num ? 'bg-emerald-500' : 'bg-muted'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ===== STEP 1: Student Info ===== */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <div className="p-1.5 rounded-lg bg-emerald-100">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  بيانات الطالبة
                </CardTitle>
                <CardDescription>أدخلي بياناتكِ الشخصية لإتمام عملية الحجز</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">الاسم الكامل <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="أدخلي اسمكِ الكامل"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">رقم الطالبة</Label>
                    <Input
                      placeholder="رقم الهوية الجامعية"
                      value={formData.studentId}
                      onChange={e => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">رقم الجوال</Label>
                    <Input
                      placeholder="05XXXXXXXX"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">التاريخ <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">الوقت <span className="text-red-500">*</span></Label>
                      <Select value={formData.timeSlot} onValueChange={v => setFormData(prev => ({ ...prev, timeSlot: v }))}>
                        <SelectTrigger className="rounded-xl h-11">
                          <SelectValue placeholder="اختر الوقت" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(slot => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedStep1}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 h-11 font-semibold transition-all duration-300 disabled:opacity-40"
                  >
                    التالي
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ===== STEP 2: Room Selection (Radio Cards) ===== */}
        {currentStep === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <div className="p-1.5 rounded-lg bg-teal-100">
                    <Building2 className="h-4 w-4 text-teal-600" />
                  </div>
                  اختيار المنطقة
                </CardTitle>
                <CardDescription>اختاري المنطقة المناسبة لحجز لوكركِ</CardDescription>
              </CardHeader>
              <CardContent>
                {rooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map(room => {
                      const isSelected = selectedRoom === room.id
                      return (
                        <motion.button
                          key={room.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedRoom(room.id)
                            setSelectedLocker(null)
                          }}
                          className={`text-right p-5 rounded-2xl border-2 transition-all duration-300 group ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
                              : 'border-transparent glass-card hover:border-emerald-200 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isSelected ? 'bg-emerald-600 shadow-lg' : 'bg-emerald-100 group-hover:bg-emerald-200'
                            }`}>
                              <Monitor className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm">{room.name}</p>
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                              </div>
                              {room.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{room.description}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-2">
                                <Box className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-medium">{room._count.lockers} لوكر</span>
                              </div>
                            </div>
                          </div>
                          {/* Radio indicator */}
                          <div className={`mt-3 h-1 rounded-full transition-all duration-300 ${
                            isSelected ? 'bg-emerald-500' : 'bg-muted'
                          }`} />
                        </motion.button>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState icon={Building2} message="لا توجد قاعات متاحة حالياً" />
                )}

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-xl px-6 h-11 font-medium"
                  >
                    السابق
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedStep2}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 h-11 font-semibold transition-all duration-300 disabled:opacity-40"
                  >
                    التالي
                    <ArrowLeft className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ===== STEP 3: Seat Selection ===== */}
        {currentStep === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <div className="p-1.5 rounded-lg bg-amber-100">
                    <Box className="h-4 w-4 text-amber-600" />
                  </div>
                  خريطة اللواكر - {currentRoom?.name}
                </CardTitle>
                <CardDescription>اضغطي على اللوكر المتاح لحجزه</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-5">
                  {[
                    { status: 'AVAILABLE', label: 'متاح', bgClass: 'bg-emerald-500' },
                    { status: 'OCCUPIED', label: 'محجوز', bgClass: 'bg-red-400' },
                    { status: 'MAINTENANCE', label: 'صيانة', bgClass: 'bg-gray-400' },
                    { status: 'SELECTED', label: 'مختار', bgClass: 'bg-amber-400' }
                  ].map(item => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-md ${item.bgClass} shadow-sm`} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Locker Map */}
                {selectedRoom && lockers.length > 0 ? (
                  <div className="overflow-x-auto custom-scrollbar">
                    {/* Stage */}
                    <div className="classroom-stage rounded-2xl px-8 py-3 mb-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Monitor className="h-5 w-5 text-emerald-700" />
                        <span className="text-sm font-bold text-emerald-800">المنصة / الشاشة</span>
                      </div>
                    </div>

                    {/* Lockers Grid */}
                    <div className="space-y-3 min-w-[500px] px-4">
                      {Array.from({ length: maxRow }, (_, i) => i + 1).map(row => {
                        const rowLockers = lockerGrid[row] || []
                        if (rowLockers.length === 0) return null
                        const maxCol = Math.max(...rowLockers.map(s => s.column))
                        const rowArray = Array.from({ length: maxCol }, (_, i) =>
                          rowLockers.find(s => s.column === i + 1)
                        )
                        const half = Math.ceil(maxCol / 2)

                        return (
                          <div key={row} className="flex items-center gap-3 justify-center">
                            <span className="text-xs text-muted-foreground font-semibold w-8 text-center">{row}</span>
                            <div className="flex gap-2">
                              {/* Left side */}
                              {rowArray.slice(0, half).map((locker, colIdx) => {
                                const isSelected = selectedLocker?.id === locker?.id
                                if (!locker) return <div key={`empty-l-${colIdx}`} className="w-12 h-12" />
                                return (
                                  <button
                                    key={locker.id}
                                    disabled={locker.status !== 'AVAILABLE'}
                                    onClick={() => handleLockerClick(locker)}
                                    className={`locker-btn w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white relative ${locker.status.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                                  >
                                    {locker.lockerNumber}
                                    <div className="locker-tooltip">
                                      لوكر {locker.lockerNumber} - {LOCKER_STATUS_LABELS[locker.status]}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            {/* Aisle */}
                            <div className="w-6 flex items-center justify-center">
                              <DoorOpen className="h-3 w-3 text-muted-foreground/30" />
                            </div>
                            <div className="flex gap-2">
                              {/* Right side */}
                              {rowArray.slice(half).map((locker, colIdx) => {
                                const isSelected = selectedLocker?.id === locker?.id
                                if (!locker) return <div key={`empty-r-${colIdx}`} className="w-12 h-12" />
                                return (
                                  <button
                                    key={locker.id}
                                    disabled={locker.status !== 'AVAILABLE'}
                                    onClick={() => handleLockerClick(locker)}
                                    className={`locker-btn w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white relative ${locker.status.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                                  >
                                    {locker.lockerNumber}
                                    <div className="locker-tooltip">
                                      لوكر {locker.lockerNumber} - {LOCKER_STATUS_LABELS[locker.status]}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            <span className="text-xs text-muted-foreground font-semibold w-8 text-center">{row}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Back */}
                    <div className="flex justify-center mt-6">
                      <div className="bg-muted rounded-b-full px-8 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <DoorOpen className="h-3.5 w-3.5" />
                        باب الدخول
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Box} message="لا توجد لواكر في هذه المنطقة" />
                )}

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="rounded-xl px-6 h-11 font-medium"
                  >
                    السابق
                  </Button>
                  <Button
                    onClick={() => {
                      if (!formData.name || !formData.date || !formData.timeSlot) {
                        alert('يرجى ملء جميع الحقول المطلوبة (الاسم، التاريخ، الوقت)')
                        setCurrentStep(1)
                        return
                      }
                      if (!selectedLocker) {
                        alert('يرجى اختيار لوكر')
                        return
                      }
                      setShowConfirm(true)
                    }}
                    disabled={!selectedLocker}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 h-11 font-semibold transition-all duration-300 disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                    تأكيد الحجز
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== STICKY CTA BOOK BUTTON ===== */}
      {selectedLocker && currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background/95 to-transparent"
        >
          <div className="max-w-7xl mx-auto">
            <Button
              onClick={() => {
                if (!formData.name || !formData.date || !formData.timeSlot) {
                  alert('يرجى ملء جميع الحقول المطلوبة')
                  setCurrentStep(1)
                  return
                }
                setShowConfirm(true)
              }}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-base shadow-xl rounded-2xl font-bold transition-all duration-300 hover:shadow-emerald-200"
              style={{ boxShadow: '0 0 30px rgba(5, 150, 105, 0.3), 0 10px 40px rgba(5, 150, 105, 0.2)' }}
            >
              <Sparkles className="h-5 w-5 ml-2" />
              حجز لوكر {selectedLocker?.lockerNumber} - {currentRoom?.name}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ===== CONFIRM DIALOG ===== */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2 text-lg">
              <div className="p-2 rounded-full bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              تأكيد الحجز
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              تأكدي من صحة بيانات الحجز قبل المتابعة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-emerald-50 rounded-2xl p-4 space-y-3 border border-emerald-100">
              {[
                { label: 'الطالبة:', value: formData.name },
                ...(formData.studentId ? [{ label: 'رقم الطالبة:', value: formData.studentId }] : []),
                ...(formData.phone ? [{ label: 'رقم الجوال:', value: formData.phone }] : []),
                { label: 'المنطقة:', value: currentRoom?.name || '' },
                { label: 'اللوكر:', value: `لوكر ${selectedLocker?.lockerNumber}` },
                { label: 'التاريخ:', value: formData.date },
                { label: 'الوقت:', value: formData.timeSlot }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1 rounded-xl h-11">
              إلغاء
            </Button>
            <Button
              onClick={handleBooking}
              disabled={bookingLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 font-semibold"
            >
              {bookingLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'تأكيد الحجز'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ====== MY BOOKINGS PAGE ======
function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings${statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchBookings()
      } else {
        alert('فشل في إلغاء الحجز')
      }
    } catch {
      alert('حدث خطأ في الاتصال')
    }
  }

  if (loading) return <BookingsPageSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
            </div>
            جميع الحجوزات
          </h2>
          <p className="text-sm text-muted-foreground mt-1">عرض وإدارة جميع الحجوزات المسجلة</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 ${
              statusFilter === tab.value
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200'
                : tab.color || 'border-border hover:border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            {tab.label}
            <span className="mr-1 opacity-70">
              ({tab.value === 'ALL' ? bookings.length : bookings.filter(b => b.status === tab.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      {bookings.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {bookings.map((booking) => (
            <motion.div key={booking.id} variants={staggerItem}>
              <div className={`booking-card status-${booking.status.toLowerCase()} glass-card rounded-2xl p-5 pr-7 h-full flex flex-col`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      booking.status === 'CONFIRMED' ? 'bg-emerald-100' :
                      booking.status === 'PENDING' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      <UserCheck className={`h-5 w-5 ${
                        booking.status === 'CONFIRMED' ? 'text-emerald-600' :
                        booking.status === 'PENDING' ? 'text-amber-600' : 'text-red-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{booking.user.name}</p>
                      {booking.user.studentId && (
                        <p className="text-[10px] text-muted-foreground font-mono">#{booking.user.studentId}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                {/* Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{booking.locker.room.name}</span>
                    <span className="text-muted-foreground">-</span>
                    <Box className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">لوكر {booking.locker.lockerNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{booking.date}</span>
                    <span className="text-muted-foreground">-</span>
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{booking.timeSlot}</span>
                  </div>
                </div>

                {/* Cancel Button */}
                {booking.status !== 'CANCELLED' && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-xl text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 text-xs font-medium h-9"
                        >
                          <XCircle className="h-3.5 w-3.5 ml-1.5" />
                          إلغاء الحجز
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            تأكيد الإلغاء
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنتِ متأكدة من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="rounded-xl">تراجع</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelBooking(booking.id)}
                            className="bg-red-500 hover:bg-red-600 rounded-xl"
                          >
                            تأكيد الإلغاء
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState icon={CalendarDays} message="لا توجد حجوزات مطابقة للفلتر المحدد" />
      )}
    </div>
  )
}

// ====== DASHBOARD PAGE ======
function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [seedLoading, setSeedLoading] = useState(false)

  // Room management
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [newRoomCapacity, setNewRoomCapacity] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, roomsRes, bookingsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/rooms'),
        fetch('/api/bookings')
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (roomsRes.ok) setRooms(await roomsRes.json())
      if (bookingsRes.ok) setBookings(await bookingsRes.json())
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleSeed = async () => {
    setSeedLoading(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      if (res.ok) {
        fetchAll()
      }
    } catch (err) {
      console.error('Seed error:', err)
    } finally {
      setSeedLoading(false)
    }
  }

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          description: newRoomDesc || null,
          capacity: Number(newRoomCapacity) || 40
        })
      })
      if (res.ok) {
        setShowAddRoom(false)
        setNewRoomName('')
        setNewRoomDesc('')
        setNewRoomCapacity('')
        fetchAll()
      }
    } catch (err) {
      console.error('Add room error:', err)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const res = await fetch(`/api/rooms?id=${roomId}`, { method: 'DELETE' })
      if (res.ok) fetchAll()
    } catch (err) {
      console.error('Delete room error:', err)
    }
  }

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchAll()
    } catch (err) {
      console.error('Update status error:', err)
    }
  }

  const barData = stats?.dailyBookings?.map(d => ({ ...d, date: d.date.slice(5) })) || []
  const roomPieData = stats?.bookingsByRoom || []

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      {/* ===== HEADER WITH SEED BUTTON ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <LayoutDashboard className="h-5 w-5 text-emerald-600" />
            </div>
            لوحة التحكم
          </h2>
          <p className="text-sm text-muted-foreground mt-1">إدارة شاملة للنظام والإحصائيات</p>
        </div>
        <Button
          onClick={handleSeed}
          disabled={seedLoading}
          className="bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl px-6 h-11 font-semibold shadow-lg shadow-emerald-200 transition-all duration-300"
        >
          {seedLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Zap className="h-4 w-4 ml-2" />
              توليد بيانات تجريبية
            </>
          )}
        </Button>
      </div>

      {/* ===== QUICK STATS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'المناطق', value: stats?.totalRooms || 0, icon: Building2, color: 'bg-emerald-600' },
          { label: 'إجمالي الحجوزات', value: stats?.totalBookings || 0, icon: CalendarDays, color: 'bg-teal-600' },
          { label: 'حجوزات قيد الانتظار', value: stats?.pendingBookings || 0, icon: Clock, color: 'bg-amber-500' },
          { label: 'الطالبات', value: stats?.totalUsers || 0, icon: Users, color: 'bg-rose-500' }
        ].map((card, idx) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="glass-card border-0 rounded-2xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className="text-xl font-bold">{card.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* ===== CHARTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="glass-card border-0 rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
              </div>
              الحجوزات اليومية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill={BAR_COLOR} radius={[6, 6, 0, 0]} name="عدد الحجوزات" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات - جرب توليد بيانات تجريبية
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Bookings by Room */}
        <Card className="glass-card border-0 rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <div className="p-1.5 rounded-lg bg-teal-100">
                <BarChart3 className="h-4 w-4 text-teal-600" />
              </div>
              حجوزات حسب المنطقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roomPieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="bookings"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {roomPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={ROOM_PIE_COLORS[index % ROOM_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== ROOM MANAGEMENT ===== */}
      <Card className="glass-card border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <Building2 className="h-4 w-4 text-emerald-600" />
              </div>
              إدارة القاعات
            </CardTitle>
            <Button
              onClick={() => setShowAddRoom(true)}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-9 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 ml-1.5" />
              إضافة قاعة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(room => {
                const roomSeats = seats => {
                  // We'll show a generic indicator since we don't have seat status per room here
                  return room._count.seats
                }
                return (
                  <motion.div
                    key={room.id}
                    whileHover={{ y: -2 }}
                    className="glass-card border-0 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                          <Monitor className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{room.name}</p>
                          {room.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{room.description}</p>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              حذف القاعة
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنتِ متأكدة من حذف &quot;{room.name}&quot;؟ سيتم حذف جميع اللواكر والحجوزات المرتبطة.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl">تراجع</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRoom(room.id)}
                              className="bg-red-500 hover:bg-red-600 rounded-xl"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Box className="h-3.5 w-3.5" />
                      <span className="font-medium">{room._count.lockers} لوكر</span>
                      <Separator orientation="vertical" className="h-3 mx-1" />
                      <span>السعة: {room.capacity}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={Building2} message="لا توجد قاعات" />
          )}
        </CardContent>
      </Card>

      {/* ===== BOOKINGS TABLE ===== */}
      <Card className="glass-card border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <div className="p-1.5 rounded-lg bg-amber-100">
              <CalendarDays className="h-4 w-4 text-amber-600" />
            </div>
            جدول الحجوزات
          </CardTitle>
          <CardDescription>إدارة وتغيير حالة الحجوزات</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar max-h-96 overflow-y-auto rounded-xl border">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="text-xs">الطالبة</TableHead>
                    <TableHead className="text-xs">المنطقة</TableHead>
                    <TableHead className="text-xs">اللوكر</TableHead>
                    <TableHead className="text-xs">التاريخ</TableHead>
                    <TableHead className="text-xs">الوقت</TableHead>
                    <TableHead className="text-xs">الحالة</TableHead>
                    <TableHead className="text-xs text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-emerald-50/50 transition-colors">
                      <TableCell className="text-xs font-medium">
                        <div>
                          <p>{booking.user.name}</p>
                          {booking.user.studentId && (
                            <p className="text-[10px] text-muted-foreground font-mono">#{booking.user.studentId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{booking.locker.room.name}</TableCell>
                      <TableCell className="text-xs font-mono">لوكر {booking.locker.lockerNumber}</TableCell>
                      <TableCell className="text-xs">{booking.date}</TableCell>
                      <TableCell className="text-xs">{booking.timeSlot}</TableCell>
                      <TableCell><StatusBadge status={booking.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {booking.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                              className="h-7 text-emerald-600 hover:bg-emerald-50 text-[10px] rounded-lg px-2"
                            >
                              <CheckCircle2 className="h-3 w-3 ml-1" />
                              تأكيد
                            </Button>
                          )}
                          {booking.status !== 'CANCELLED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                              className="h-7 text-red-500 hover:bg-red-50 text-[10px] rounded-lg px-2"
                            >
                              <XCircle className="h-3 w-3 ml-1" />
                              إلغاء
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={CalendarDays} message="لا توجد حجوزات" />
          )}
        </CardContent>
      </Card>

      {/* ===== ADD ROOM DIALOG ===== */}
      <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <Plus className="h-4 w-4 text-emerald-600" />
              </div>
              إضافة قاعة جديدة
            </DialogTitle>
            <DialogDescription>أدخلي بيانات القاعة الجديدة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">اسم القاعة <span className="text-red-500">*</span></Label>
              <Input
                placeholder="مثال: قاعة المحاضرات ٢"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">الوصف</Label>
              <Input
                placeholder="وصف مختصر للقاعة"
                value={newRoomDesc}
                onChange={e => setNewRoomDesc(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">السعة (عدد المقاعد)</Label>
              <Input
                type="number"
                placeholder="40"
                value={newRoomCapacity}
                onChange={e => setNewRoomCapacity(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddRoom(false)} className="flex-1 rounded-xl h-11">
              إلغاء
            </Button>
            <Button
              onClick={handleAddRoom}
              disabled={!newRoomName.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 font-semibold"
            >
              إضافة المنطقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
