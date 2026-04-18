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
  ArrowLeft, Sparkles, Monitor, DoorOpen, Zap, UserCheck, ChevronLeft, Wrench,
  LogIn, LogOut, UserPlus, Eye, EyeOff, Mail, Lock, User,
  MessageSquare, Star, Send, Twitter, ChevronDown, MapPin, MessageCircle, Heart, Globe
} from 'lucide-react'

// ====== Types ======
interface Room {
  id: string
  name: string
  description: string | null
  capacity: number
  createdAt: string
  _count: { seats: number }
}

interface Seat {
  id: string
  seatNumber: number
  row: number
  column: number
  roomId: string
  status: string
}

interface Booking {
  id: string
  userId: string
  seatId: string
  date: string
  timeSlot: string
  status: string
  createdAt: string
  updatedAt: string
  user: { id: string; name: string; studentId: string | null; phone: string | null }
  seat: Seat & { room: Room }
}

interface Stats {
  totalSeats: number
  availableSeats: number
  occupiedSeats: number
  maintenanceSeats: number
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

interface CurrentUser {
  id: string
  name: string
  email: string
  studentId: string | null
  phone: string | null
  role: string
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

const SEAT_STATUS_LABELS: Record<string, string> = {
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
  { value: 'booking', label: 'حجز لواكر', icon: Sofa },
  { value: 'my-bookings', label: 'حجوزاتي', icon: CalendarDays },
  { value: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard }
]

const STAT_CARDS = [
  { key: 'totalSeats', label: 'إجمالي اللواكر', icon: Armchair, gradient: 'from-emerald-500 to-emerald-700', accent: '#059669', accentLight: '#10b981' },
  { key: 'availableSeats', label: 'اللواكر المتاحة', icon: CheckCircle2, gradient: 'from-teal-400 to-teal-600', accent: '#14b8a6', accentLight: '#5eead4' },
  { key: 'occupiedSeats', label: 'اللواكر المحجوزة', icon: XCircle, gradient: 'from-red-400 to-red-600', accent: '#ef4444', accentLight: '#fca5a5' },
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
  const IconComponent = Icon || Armchair
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

// ====== AUTH MODAL COMPONENT ======
function AuthModal({
  open,
  onOpenChange,
  authMode,
  setAuthMode,
  onAuthSuccess
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  authMode: 'login' | 'register'
  setAuthMode: (mode: 'login' | 'register') => void
  onAuthSuccess: (user: CurrentUser, token: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regStudentId, setRegStudentId] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail.trim() || !loginPassword.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('auth_token', data.token)
        onAuthSuccess(data.user, data.token)
        onOpenChange(false)
        setLoginEmail('')
        setLoginPassword('')
      } else {
        setError(data.error || 'فشل في تسجيل الدخول')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) return
    if (regPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (regPassword !== regConfirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          studentId: regStudentId || undefined,
          phone: regPhone || undefined
        })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('auth_token', data.token)
        onAuthSuccess(data.user, data.token)
        onOpenChange(false)
        setRegName('')
        setRegEmail('')
        setRegStudentId('')
        setRegPhone('')
        setRegPassword('')
        setRegConfirmPassword('')
      } else {
        setError(data.error || 'فشل في إنشاء الحساب')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 bg-white/95 backdrop-blur-xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-l from-emerald-600 to-teal-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-white/20" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10" />
          </div>
          <motion.div
            key={authMode}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/30">
              {authMode === 'login' ? (
                <LogIn className="h-8 w-8" />
              ) : (
                <UserPlus className="h-8 w-8" />
              )}
            </div>
            <h2 className="text-xl font-bold">
              {authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h2>
            <p className="text-emerald-100 text-xs mt-1">
              {authMode === 'login'
                ? 'أدخلي بياناتكِ للوصول إلى حسابكِ'
                : 'أنشئي حسابكِ في نظام حصين لحجز اللواكر'}
            </p>
          </motion.div>
        </div>

        {/* Form */}
        <motion.div
          key={`form-${authMode}`}
          initial={{ opacity: 0, x: authMode === 'login' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-xs font-medium flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                  البريد الإلكتروني
                </Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={loginEmail}
                  onChange={e => { setLoginEmail(e.target.value); setError(null) }}
                  className="rounded-xl h-11 focus:ring-emerald-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => { setLoginPassword(e.target.value); setError(null) }}
                    className="rounded-xl h-11 focus:ring-emerald-300 pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || !loginEmail.trim() || !loginPassword.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg shadow-emerald-200"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4 ml-2" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                ليس لديكِ حساب؟{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(null) }}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  إنشاء حساب جديد
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  الاسم الكامل <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="أدخلي اسمكِ الكامل"
                  value={regName}
                  onChange={e => { setRegName(e.target.value); setError(null) }}
                  className="rounded-xl h-11 focus:ring-emerald-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={regEmail}
                  onChange={e => { setRegEmail(e.target.value); setError(null) }}
                  className="rounded-xl h-11 focus:ring-emerald-300"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">رقم الطالبة</Label>
                  <Input
                    placeholder="رقم الهوية"
                    value={regStudentId}
                    onChange={e => { setRegStudentId(e.target.value); setError(null) }}
                    className="rounded-xl h-11 focus:ring-emerald-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">رقم الجوال</Label>
                  <Input
                    placeholder="05XXXXXXXX"
                    value={regPhone}
                    onChange={e => { setRegPhone(e.target.value); setError(null) }}
                    className="rounded-xl h-11 focus:ring-emerald-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  كلمة المرور <span className="text-red-500">*</span>
                  <span className="text-[10px] text-muted-foreground font-normal">(6 أحرف على الأقل)</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => { setRegPassword(e.target.value); setError(null) }}
                    className="rounded-xl h-11 focus:ring-emerald-300 pl-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={e => { setRegConfirmPassword(e.target.value); setError(null) }}
                    className="rounded-xl h-11 focus:ring-emerald-300 pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showRegConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || !regName.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg shadow-emerald-200"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إنشاء حساب
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                لديكِ حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(null) }}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  تسجيل الدخول
                </button>
              </p>
            </form>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

// ====== FAQ SECTION ======
function FAQSection() {
  const faqs = [
    {
      q: 'كيف يمكنني حجز لوكر؟',
      a: 'قم بتسجيل الدخول، اختر القاعة المفضلة، ثم اختر اللوكر المتاح وأكد حجزك. ستحصل على إشعار بتفاصيل الحجز.'
    },
    {
      q: 'هل يمكنني اختيار موقع اللوكر؟',
      a: 'نعم، النظام يعرض لك خريطة تفاعلية للقاعة تظهر جميع اللواكر المتاحة؛ يمكنك اختيار أي لوكر تراه مناسباً لك.'
    },
    {
      q: 'كم مدة الحجز؟',
      a: 'تتوفر اللواكر للحجز خلال فترات اليوم الدراسي (من الساعة 8 صباحاً وحتى 2:30 ظهراً)، ويمكنك اختيار الفترة التي تناسب جدولك.'
    }
  ]

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Card className="glass-card border-0 rounded-2xl overflow-hidden mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 font-bold text-emerald-700">
          <div className="p-1.5 rounded-lg bg-emerald-100">
            <BookOpen className="h-5 w-5 text-emerald-600" />
          </div>
          الأسئلة الشائعة
        </CardTitle>
        <CardDescription>كل ما تحتاجين معرفته عن نظام حجز اللواكر</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {faqs.map((faq, idx) => (
          <div key={idx} className="border border-emerald-100 rounded-xl overflow-hidden bg-white/50">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 text-right hover:bg-emerald-50 transition-colors"
            >
              <span className="font-semibold text-sm text-emerald-900">{faq.q}</span>
              <ChevronDown className={`h-4 w-4 text-emerald-600 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="p-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-emerald-50">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ====== RATING SYSTEM ======
function RatingSystem({ currentUser }: { currentUser: CurrentUser | null }) {
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (stars === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stars,
          comment,
          userId: currentUser?.id
        })
      })
      if (res.ok) {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Rating error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="glass-card border-0 rounded-2xl p-8 text-center mt-8 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8 text-emerald-600 fill-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-emerald-900 mb-2">شكراً لتقييمك!</h3>
        <p className="text-sm text-emerald-700">نحن نقدر رأيكِ ونسعى دائماً لتطوير خدماتنا.</p>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-0 rounded-2xl overflow-hidden mt-8 shadow-lg">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
        <h3 className="text-lg font-bold">شاركينا رأيكِ</h3>
        <p className="text-emerald-100 text-xs mt-1">تقييمكِ يساعدنا على تحسين النظام</p>
      </div>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setStars(star)}
                className="transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`h-9 w-9 ${
                    star <= (hover || stars) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground opacity-30'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {stars === 5 ? 'ممتاز جداً!' : stars === 4 ? 'جيد جداً' : stars === 3 ? 'جيد' : stars === 2 ? 'مقبول' : stars === 1 ? 'سيء' : 'اضغطي لاختيار التقييم'}
          </span>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-emerald-900">ملاحظاتكِ (اختياري)</Label>
          <Input
            placeholder="أخبرينا عن تجربتكِ..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="rounded-xl border-emerald-100 focus:ring-emerald-300 min-h-[80px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={stars === 0 || submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-bold shadow-lg shadow-emerald-200 transition-all"
        >
          {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'إرسال التقييم'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ====== AUTO REPLY CHAT ======
function AutoReplyChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([
    { text: 'مرحباً بكِ! أنا المساعد الذكي لنظام حصين. كيف يمكنني مساعدتكِ اليوم؟', isBot: true }
  ])
  const [inputValue, setInputValue] = useState('')

  const quickQuestions = [
    { q: 'كيف أحجز؟', a: 'يمكنكِ الحجز عن طريق التوجه لعلامة التبويب "حجز للوكر"، اختيار القاعة ثم اللوكر المتاح.' },
    { q: 'أين موقع الكلية؟', a: 'الكلية التقنية للبنات بالطائف تقع في [حي الرميدة، الطائف]، ويمكنكِ الوصول إليها بسهولة عبر خرائط جوجل.' },
    { q: 'الموقع الرسمي', a: 'يمكنكِ زيارة بوابة "قبولي" (https://adm.tvtc.gov.sa) أو الموقع الرسمي (https://tvtc.gov.sa) للوصول لخدمات الكلية.' }
  ]

  const handleSend = (text: string) => {
    if (!text.trim()) return
    const newMsgs = [...messages, { text, isBot: false }]
    setMessages(newMsgs)
    setInputValue('')

    // Simple Auto-Reply logic
    setTimeout(() => {
      let reply = 'عذراً، لم أفهم سؤالكِ جيداً. يمكنكِ اختيار أحد الأسئلة الشائعة أو التواصل معنا عبر تويتر.'
      const lowerText = text.toLowerCase()
      
      if (lowerText.includes('حجز') || lowerText.includes('لوكر')) {
        reply = 'لحجز لوكر، سجلي دخولكِ أولاً ثم اختاري القاعة واللوكر المفضل من الخريطة.'
      } else if (lowerText.includes('تواصل') || lowerText.includes('تويتر') || lowerText.includes('موقع')) {
        reply = 'يمكنكِ زيارة الموقع الرسمي للكلية: https://tvtc.gov.sa أو بوابة القبول "قبولي": https://adm.tvtc.gov.sa'
      } else if (lowerText.includes('مكان')) {
        reply = 'الكلية التقنية للبنات بالطائف توفر خدماتها في مقرها الرسمي بمدينة الطائف (حي الرميدة).'
      }

      setMessages(prev => [...prev, { text: reply, isBot: true }])
    }, 1000)
  }

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[320px] sm:w-[380px] h-[500px] glass-card border-emerald-100 shadow-2xl rounded-3xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">المساعد الذكي (حصين)</h4>
                  <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    متصل الآن
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-emerald-50/10">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.isBot ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    m.isBot 
                      ? 'bg-white text-emerald-900 rounded-tr-none' 
                      : 'bg-emerald-600 text-white rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              
              {/* Quick Options */}
              {messages.length < 5 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {quickQuestions.map((qq, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const newMsgs = [...messages, { text: qq.q, isBot: false }]
                        setMessages(newMsgs)
                        setTimeout(() => setMessages(prev => [...prev, { text: qq.a, isBot: true }]), 800)
                      }}
                      className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-200 transition-colors"
                    >
                      {qq.q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-emerald-50">
              <div className="relative">
                <Input
                  placeholder="اكتبي سؤالكِ هنا..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                  className="rounded-full pr-4 pl-12 h-11 border-emerald-100 focus:ring-emerald-300"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  className="absolute left-1.5 top-1.5 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-2xl flex items-center justify-center border-4 border-white relative group"
      >
        {isOpen ? <XCircle className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">1</span>
        )}
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-20 bg-emerald-900 text-white text-[10px] px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
            نساعدك؟ أهلاً بكِ في حصين
          </div>
        )}
      </motion.button>
    </div>
  )
}

// ====== MAIN APPLICATION ======
export default function SeatBookingApp() {
  const [activeTab, setActiveTab] = useState('home')

  // Auth state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  // Restore session on mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
        .then(res => {
          if (res.ok) return res.json()
          throw new Error('Session expired')
        })
        .then(data => {
          setCurrentUser(data.user)
          setToken(savedToken)
        })
        .catch(() => {
          localStorage.removeItem('auth_token')
        })
    }
  }, [])

  const handleAuthSuccess = (user: CurrentUser, newToken: string) => {
    setCurrentUser(user)
    setToken(newToken)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setToken(null)
    if (typeof window !== 'undefined') localStorage.removeItem('auth_token')
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== HEADER ===== */}
      <header className="header-gradient text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between relative z-10">
            {/* Logo + Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight tracking-tight">حصين لحجز للوكر</h1>
                <p className="text-[11px] text-emerald-100 font-medium">الكليه التقنيه</p>
              </div>
            </div>

            {/* Right side: Clock + Auth Buttons */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex">
                <RealTimeClock />
              </div>
              {currentUser ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2 bg-white/15 hover:bg-white/20 rounded-full px-3 py-1.5 backdrop-blur-sm border border-white/20 transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {getUserInitials(currentUser.name)}
                    </div>
                    <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline-block">{currentUser.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 bg-white/15 hover:bg-red-500/80 rounded-full px-3 py-2 backdrop-blur-sm transition-all duration-300 border border-white/20 hover:border-red-400 group"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold hidden sm:inline-block">خروج</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}
                    className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-full px-4 py-2 backdrop-blur-sm transition-all duration-300 border border-white/20 hover:border-white/40 hover:shadow-lg group"
                  >
                    <LogIn className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">تسجيل الدخول</span>
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setShowAuthModal(true) }}
                    className="flex items-center gap-2 bg-emerald-500/80 hover:bg-emerald-500 rounded-full px-4 py-2 backdrop-blur-sm transition-all duration-300 border border-emerald-400/50 hover:border-emerald-400 hover:shadow-lg shadow-emerald-900/20 group"
                  >
                    <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">إنشاء حساب</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== AUTH MODAL ===== */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        authMode={authMode}
        setAuthMode={setAuthMode}
        onAuthSuccess={handleAuthSuccess}
      />

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
                <HomePage onTabChange={handleTabChange} currentUser={currentUser} />
              </TabsContent>
              <TabsContent value="booking" className="mt-0">
                <BookingPage
                  currentUser={currentUser}
                  token={token}
                  onOpenAuthModal={() => { setAuthMode('login'); setShowAuthModal(true) }}
                />
              </TabsContent>
              <TabsContent value="my-bookings" className="mt-0">
                <MyBookingsPage
                  currentUser={currentUser}
                  token={token}
                  onOpenAuthModal={() => { setAuthMode('login'); setShowAuthModal(true) }}
                />
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
              <span className="font-medium">حصين لحجز اللواكر</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-center font-bold">نظام حصين لحجز اللواكر الإلكتروني &copy; {new Date().getFullYear()}</p>
              <div className="flex items-center gap-2 text-[10px] opacity-80">
                <MapPin className="h-3 w-3 text-emerald-600" />
                <span>الكلية التقنية بالطائف</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                <span>المؤسسة العامة للتدريب التقني والمهني</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-3">
                <a 
                  href="https://tvtc.gov.sa" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                  title="الموقع الرسمي للكلية التقنية"
                >
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">موقع الكلية</span>
                </a>
                <Separator orientation="vertical" className="h-3" />
                <a 
                  href="https://adm.tvtc.gov.sa" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-600 transition-colors text-xs font-medium"
                  title="بوابة قبولي"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">بوابة قبولي</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== AUTO REPLY CHAT ===== */}
      <AutoReplyChat />
    </div>
  )
}

// ====== HOME PAGE ======
function HomePage({ 
  onTabChange,
  currentUser
}: { 
  onTabChange: (v: string) => void,
  currentUser: CurrentUser | null
}) {
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
    { name: 'متاح', value: stats.availableSeats },
    { name: 'محجوز', value: stats.occupiedSeats },
    { name: 'صيانة', value: stats.maintenanceSeats }
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
              <h2 className="text-2xl font-bold leading-tight">مرحبًا بك في حصين لحجز اللواكر</h2>
              <p className="text-emerald-100 text-sm font-medium">الكلية التقنية بالطائف</p>
            </div>
          </div>
          <p className="text-emerald-50 text-sm mt-2 leading-relaxed max-w-xl">
            يمكنكِ حجز لوكركِ بسهولة عبر النظام الإلكتروني. اختر القاعة والتاريخ المناسبين لكِ واستمتعي بتجربة تعليمية مريحة.
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
            : card.key === 'totalSeats'
              ? 100
              : stats.totalSeats > 0
                ? Math.round((Number(rawValue) / stats.totalSeats) * 100)
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
                توزيع حالة اللوكرات
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
                        <span>لوكر {booking.seat.seatNumber}</span>
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

      {/* ===== NEW SECTIONS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <div className="space-y-6">
          <FAQSection />
        </div>
        <div className="space-y-6">
          <RatingSystem currentUser={currentUser} />
        </div>
      </div>
    </div>
  )
}

// ====== BOOKING PAGE ======
function BookingPage({
  currentUser,
  token,
  onOpenAuthModal
}: {
  currentUser: CurrentUser | null
  token: string | null
  onOpenAuthModal: () => void
}) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // When not logged in, use 3-step flow; when logged in, use 2-step flow
  const isLoggedIn = !!currentUser && !!token
  const [currentStep, setCurrentStep] = useState(isLoggedIn ? 1 : 1)

  // Guest form data (only used when not logged in)
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
          setSeats(data)
        }
      } catch (err) {
        console.error('Error fetching seats:', err)
      }
    }
    fetchSeats()
  }, [selectedRoom])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setFormData(prev => ({ ...prev, date: today }))
  }, [])

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return
    setSelectedSeat(seat)
  }

  const handleBooking = async () => {
    if (isLoggedIn) {
      // Authenticated booking
      if (!selectedSeat || !formData.date || !formData.timeSlot) return
      setBookingLoading(true)
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            seatId: selectedSeat.id,
            date: formData.date,
            timeSlot: formData.timeSlot
          })
        })
        if (res.ok) {
          const booking = await res.json()
          setSuccessMessage(`تم حجز لوكر ${booking.seat.seatNumber} في ${booking.seat.room.name} بنجاح!`)
          setShowConfirm(false)
          setSelectedSeat(null)
          setCurrentStep(1)
          setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0], timeSlot: '' }))
          setSelectedRoom('')
          if (selectedRoom) {
            const seatsRes = await fetch(`/api/seats?roomId=${selectedRoom}`)
            if (seatsRes.ok) setSeats(await seatsRes.json())
          }
        } else {
          const err = await res.json()
          alert(err.error || 'حدث خطأ أثناء الحجز')
        }
      } catch {
        alert('حدث خطأ في الاتصال')
      } finally {
        setBookingLoading(false)
      }
    } else {
      // Guest booking (existing behavior)
      if (!selectedSeat || !formData.name || !formData.date || !formData.timeSlot) return
      setBookingLoading(true)
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            studentId: formData.studentId || undefined,
            phone: formData.phone || undefined,
            seatId: selectedSeat.id,
            date: formData.date,
            timeSlot: formData.timeSlot
          })
        })
        if (res.ok) {
          const booking = await res.json()
          setSuccessMessage(`تم حجز لوكر ${booking.seat.seatNumber} في ${booking.seat.room.name} بنجاح!`)
          setShowConfirm(false)
          setSelectedSeat(null)
          setCurrentStep(1)
          setFormData({ name: '', studentId: '', phone: '', date: new Date().toISOString().split('T')[0], timeSlot: '' })
          setSelectedRoom('')
          const seatsRes = await fetch(`/api/seats?roomId=${selectedRoom}`)
          if (seatsRes.ok) setSeats(await seatsRes.json())
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
  }

  // Validation for guest flow
  const canProceedStep1 = formData.name.trim() !== ''
  const canProceedStep2 = isLoggedIn ? selectedRoom !== '' && formData.date !== '' && formData.timeSlot !== '' : selectedRoom !== ''
  const canProceedStep3 = selectedRoom !== '' && seats.length > 0

  // Step labels differ based on auth state
  const STEP_LABELS_LOGGED_IN = [
    { num: 1, label: 'اختيار القاعة والموعد', icon: Building2 },
    { num: 2, label: 'اختيار لوكر', icon: Armchair }
  ]

  const STEP_LABELS_GUEST = [
    { num: 1, label: 'بيانات الطالبة', icon: Users },
    { num: 2, label: 'اختيار القاعة', icon: Building2 },
    { num: 3, label: 'اختيار لوكر', icon: Armchair }
  ]

  const STEP_LABELS = isLoggedIn ? STEP_LABELS_LOGGED_IN : STEP_LABELS_GUEST

  // Group seats by row
  const maxRow = seats.length > 0 ? Math.max(...seats.map(s => s.row)) : 0
  const seatGrid: Record<number, Seat[]> = {}
  seats.forEach(seat => {
    if (!seatGrid[seat.row]) seatGrid[seat.row] = []
    seatGrid[seat.row].push(seat)
  })
  const currentRoom = rooms.find(r => r.id === selectedRoom)

  if (loading) return <BookingPageSkeleton />

  // When not logged in: show login prompt
  if (!isLoggedIn) {
    return (
      <div className="space-y-6 pb-24">
        {/* Login Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">سجّلي دخولكِ لحجز لوكركِ</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                لضمان إدارة حجوزاتكِ بسهولة وتأمين بياناتكِ، يرجى تسجيل الدخول أو إنشاء حساب جديد قبل الحجز.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={onOpenAuthModal}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 h-11 font-semibold transition-all duration-300 shadow-lg shadow-emerald-200"
                >
                  <LogIn className="h-4 w-4 ml-2" />
                  تسجيل الدخول
                </Button>
                <Button
                  onClick={() => {
                    // Allow guest booking by resetting step
                    setCurrentStep(1)
                  }}
                  variant="outline"
                  className="rounded-xl px-6 h-11 font-medium border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                >
                  <User className="h-4 w-4 ml-2" />
                  الحجز كضيفة
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Guest Booking Form - shown below when they choose to book as guest */}
        <GuestBookingForm
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          formData={formData}
          setFormData={setFormData}
          canProceedStep1={canProceedStep1}
          canProceedStep2={canProceedStep2}
          canProceedStep3={canProceedStep3}
          STEP_LABELS={STEP_LABELS_GUEST}
          rooms={rooms}
          selectedRoom={selectedRoom}
          setSelectedRoom={setSelectedRoom}
          seats={seats}
          selectedSeat={selectedSeat}
          setSelectedSeat={setSelectedSeat}
          handleSeatClick={handleSeatClick}
          maxRow={maxRow}
          seatGrid={seatGrid}
          currentRoom={currentRoom}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
          handleBooking={handleBooking}
          bookingLoading={bookingLoading}
          successMessage={successMessage}
          setSuccessMessage={setSuccessMessage}
        />
      </div>
    )
  }

  // Logged in booking flow (2 steps)
  return (
    <div className="space-y-6 pb-24">
      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 rounded-2xl overflow-hidden bg-gradient-to-l from-emerald-50 to-teal-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                {currentUser!.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{currentUser!.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {currentUser!.studentId && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      #{currentUser!.studentId}
                    </span>
                  )}
                  {currentUser!.phone && (
                    <span dir="ltr">{currentUser!.phone}</span>
                  )}
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                مسجلة الدخول
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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

      {/* ===== STEPPER (2 steps when logged in) ===== */}
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
                  {idx < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all duration-500 ${currentStep > step.num ? 'bg-emerald-500' : 'bg-muted'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* ===== STEP 1: Room + Date/Time Selection ===== */}
        {currentStep === 1 && (
          <motion.div key="step1-logged" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <div className="p-1.5 rounded-lg bg-emerald-100">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  اختيار القاعة والموعد
                </CardTitle>
                <CardDescription>اختاري القاعة والتاريخ والوقت المناسبين</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Date and Time Row */}
                <div className="grid grid-cols-2 gap-4 mb-5">
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

                {/* Room Selection */}
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
                            setSelectedSeat(null)
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
                                <Armchair className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-medium">{room._count.seats} لوكر</span>
                              </div>
                            </div>
                          </div>
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

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setCurrentStep(2)}
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

        {/* ===== STEP 2: Seat Selection ===== */}
        {currentStep === 2 && (
          <motion.div key="step2-logged" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <div className="p-1.5 rounded-lg bg-amber-100">
                    <Armchair className="h-4 w-4 text-amber-600" />
                  </div>
                  خريطة اللوكرات - {currentRoom?.name}
                </CardTitle>
                <CardDescription>اضغطي على اللوكر المتاح لحجزه</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Booking Info Summary */}
                <div className="flex flex-wrap gap-3 mb-5">
                  <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-700">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formData.date}
                  </div>
                  <div className="flex items-center gap-1.5 bg-teal-50 rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700">
                    <Clock className="h-3.5 w-3.5" />
                    {formData.timeSlot}
                  </div>
                </div>

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

                {/* Seat Map */}
                {selectedRoom && seats.length > 0 ? (
                  <div className="overflow-x-auto custom-scrollbar">
                    <div className="classroom-stage rounded-2xl px-8 py-3 mb-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Monitor className="h-5 w-5 text-emerald-700" />
                        <span className="text-sm font-bold text-emerald-800">المنصة / الشاشة</span>
                      </div>
                    </div>

                    <div className="space-y-3 min-w-[500px] px-4">
                      {Array.from({ length: maxRow }, (_, i) => i + 1).map(row => {
                        const rowSeats = seatGrid[row] || []
                        if (rowSeats.length === 0) return null
                        const maxCol = Math.max(...rowSeats.map(s => s.column))
                        const rowArray = Array.from({ length: maxCol }, (_, i) =>
                          rowSeats.find(s => s.column === i + 1)
                        )
                        const half = Math.ceil(maxCol / 2)

                        return (
                          <div key={row} className="flex items-center gap-3 justify-center">
                            <span className="text-xs text-muted-foreground font-semibold w-8 text-center">{row}</span>
                            <div className="flex gap-2">
                              {rowArray.slice(0, half).map((seat, colIdx) => {
                                const isSelected = selectedSeat?.id === seat?.id
                                if (!seat) return <div key={`empty-l-${colIdx}`} className="w-12 h-12" />
                                return (
                                  <button
                                    key={seat.id}
                                    disabled={seat.status !== 'AVAILABLE'}
                                    onClick={() => handleSeatClick(seat)}
                                    className={`seat-btn w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white relative ${seat.status.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                                  >
                                    {seat.seatNumber}
                                    <div className="seat-tooltip">
                                      لوكر {seat.seatNumber} - {SEAT_STATUS_LABELS[seat.status]}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            <div className="w-6 flex items-center justify-center">
                              <DoorOpen className="h-3 w-3 text-muted-foreground/30" />
                            </div>
                            <div className="flex gap-2">
                              {rowArray.slice(half).map((seat, colIdx) => {
                                const isSelected = selectedSeat?.id === seat?.id
                                if (!seat) return <div key={`empty-r-${colIdx}`} className="w-12 h-12" />
                                return (
                                  <button
                                    key={seat.id}
                                    disabled={seat.status !== 'AVAILABLE'}
                                    onClick={() => handleSeatClick(seat)}
                                    className={`seat-btn w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white relative ${seat.status.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                                  >
                                    {seat.seatNumber}
                                    <div className="seat-tooltip">
                                      لوكر {seat.seatNumber} - {SEAT_STATUS_LABELS[seat.status]}
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

                    <div className="flex justify-center mt-6">
                      <div className="bg-muted rounded-b-full px-8 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <DoorOpen className="h-3.5 w-3.5" />
                        باب الدخول
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Armchair} message="لا توجد لوكرات في هذه القاعة" />
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
                    onClick={() => {
                      if (!formData.date || !formData.timeSlot) {
                        alert('يرجى اختيار التاريخ والوقت')
                        setCurrentStep(1)
                        return
                      }
                      if (!selectedSeat) {
                        alert('يرجى اختيار لوكر')
                        return
                      }
                      setShowConfirm(true)
                    }}
                    disabled={!selectedSeat}
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
      {selectedSeat && currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background/95 to-transparent"
        >
          <div className="max-w-7xl mx-auto">
            <Button
              onClick={() => {
                if (!formData.date || !formData.timeSlot) {
                  alert('يرجى اختيار التاريخ والوقت')
                  setCurrentStep(1)
                  return
                }
                setShowConfirm(true)
              }}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-base shadow-xl rounded-2xl font-bold transition-all duration-300 hover:shadow-emerald-200"
              style={{ boxShadow: '0 0 30px rgba(5, 150, 105, 0.3), 0 10px 40px rgba(5, 150, 105, 0.2)' }}
            >
              <Sparkles className="h-5 w-5 ml-2" />
              حجز لوكر {selectedSeat.seatNumber} - {currentRoom?.name}
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
                { label: 'الطالبة:', value: currentUser!.name },
                ...(currentUser!.studentId ? [{ label: 'رقم الطالبة:', value: currentUser!.studentId! }] : []),
                ...(currentUser!.phone ? [{ label: 'رقم الجوال:', value: currentUser!.phone! }] : []),
                { label: 'القاعة:', value: currentRoom?.name || '' },
                { label: 'اللوكر:', value: `لوكر ${selectedSeat?.seatNumber}` },
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

// ====== GUEST BOOKING FORM COMPONENT ======
function GuestBookingForm({
  currentStep,
  setCurrentStep,
  formData,
  setFormData,
  canProceedStep1,
  canProceedStep2,
  canProceedStep3,
  STEP_LABELS,
  rooms,
  selectedRoom,
  setSelectedRoom,
  seats,
  selectedSeat,
  setSelectedSeat,
  handleSeatClick,
  maxRow,
  seatGrid,
  currentRoom,
  showConfirm,
  setShowConfirm,
  handleBooking,
  bookingLoading,
  successMessage,
  setSuccessMessage
}: {
  currentStep: number
  setCurrentStep: (step: number) => void
  formData: { name: string; studentId: string; phone: string; date: string; timeSlot: string }
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; studentId: string; phone: string; date: string; timeSlot: string }>>
  canProceedStep1: boolean
  canProceedStep2: boolean
  canProceedStep3: boolean
  STEP_LABELS: { num: number; label: string; icon: React.ElementType }[]
  rooms: Room[]
  selectedRoom: string
  setSelectedRoom: (room: string) => void
  seats: Seat[]
  selectedSeat: Seat | null
  setSelectedSeat: (seat: Seat | null) => void
  handleSeatClick: (seat: Seat) => void
  maxRow: number
  seatGrid: Record<number, Seat[]>
  currentRoom: Room | undefined
  showConfirm: boolean
  setShowConfirm: (show: boolean) => void
  handleBooking: () => void
  bookingLoading: boolean
  successMessage: string | null
  setSuccessMessage: (msg: string | null) => void
}) {
  return (
    <>
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
          <motion.div key="step1-guest" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
          <motion.div key="step2-guest" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <div className="p-1.5 rounded-lg bg-teal-100">
                    <Building2 className="h-4 w-4 text-teal-600" />
                  </div>
                  اختيار القاعة
                </CardTitle>
                <CardDescription>اختاري القاعة المناسبة لحجز لوكركِ</CardDescription>
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
                            setSelectedSeat(null)
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
                                <Armchair className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-medium">{room._count.seats} لوكر</span>
                              </div>
                            </div>
                          </div>
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
          <motion.div key="step3-guest" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass-card border-0 rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <div className="p-1.5 rounded-lg bg-amber-100">
                    <Armchair className="h-4 w-4 text-amber-600" />
                  </div>
                  خريطة اللوكرات - {currentRoom?.name}
                </CardTitle>
                <CardDescription>اضغطي على اللوكر المتاح لحجزه</CardDescription>
              </CardHeader>
              <CardContent>
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

                {selectedRoom && seats.length > 0 ? (
                  <div className="overflow-x-auto custom-scrollbar">
                    <div className="classroom-stage rounded-2xl px-8 py-3 mb-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Monitor className="h-5 w-5 text-emerald-700" />
                        <span className="text-sm font-bold text-emerald-800">المنصة / الشاشة</span>
                      </div>
                    </div>

                    <div className="space-y-3 min-w-[500px] px-4">
                      {Array.from({ length: maxRow }, (_, i) => i + 1).map(row => {
                        const rowSeats = seatGrid[row] || []
                        if (rowSeats.length === 0) return null
                        const maxCol = Math.max(...rowSeats.map(s => s.column))
                        const rowArray = Array.from({ length: maxCol }, (_, i) =>
                          rowSeats.find(s => s.column === i + 1)
                        )
                        const half = Math.ceil(maxCol / 2)

                        return (
                          <div key={row} className="flex items-center gap-3 justify-center">
                            <span className="text-xs text-muted-foreground font-semibold w-8 text-center">{row}</span>
                            <div className="flex gap-2">
                              {rowArray.slice(0, half).map((seat, colIdx) => {
                                const isSelected = selectedSeat?.id === seat?.id
                                if (!seat) return <div key={`empty-l-${colIdx}`} className="w-12 h-12" />
                                return (
                                  <button
                                    key={seat.id}
                                    disabled={seat.status !== 'AVAILABLE'}
                                    onClick={() => handleSeatClick(seat)}
                                    className={`seat-btn w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white relative ${seat.status.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                                  >
                                    {seat.seatNumber}
                                    <div className="seat-tooltip">
                                      لوكر {seat.seatNumber} - {SEAT_STATUS_LABELS[seat.status]}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                            <div className="w-6 flex items-center justify-center">
                              <DoorOpen className="h-3 w-3 text-muted-foreground/30" />
                            </div>
                            <div className="flex gap-2">
                              {rowArray.slice(half).map((seat, colIdx) => {
                                const isSelected = selectedSeat?.id === seat?.id
                                if (!seat) return <div key={`empty-r-${colIdx}`} className="w-12 h-12" />
                                return (
                                  <button
                                    key={seat.id}
                                    disabled={seat.status !== 'AVAILABLE'}
                                    onClick={() => handleSeatClick(seat)}
                                    className={`seat-btn w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white relative ${seat.status.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                                  >
                                    {seat.seatNumber}
                                    <div className="seat-tooltip">
                                      لوكر {seat.seatNumber} - {SEAT_STATUS_LABELS[seat.status]}
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

                    <div className="flex justify-center mt-6">
                      <div className="bg-muted rounded-b-full px-8 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <DoorOpen className="h-3.5 w-3.5" />
                        باب الدخول
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={Armchair} message="لا توجد لوكرات في هذه القاعة" />
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
                      if (!selectedSeat) {
                        alert('يرجى اختيار لوكر')
                        return
                      }
                      setShowConfirm(true)
                    }}
                    disabled={!selectedSeat}
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
      {selectedSeat && currentStep === 3 && (
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
              حجز لوكر {selectedSeat.seatNumber} - {currentRoom?.name}
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
                { label: 'القاعة:', value: currentRoom?.name || '' },
                { label: 'اللوكر:', value: `لوكر ${selectedSeat?.seatNumber}` },
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
    </>
  )
}

// ====== MY BOOKINGS PAGE ======
function MyBookingsPage({
  currentUser,
  token,
  onOpenAuthModal
}: {
  currentUser: CurrentUser | null
  token: string | null
  onOpenAuthModal: () => void
}) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const isLoggedIn = !!currentUser && !!token

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (isLoggedIn && currentUser) {
        params.set('userId', currentUser.id)
      }
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter)
      }
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/bookings${query}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, isLoggedIn, currentUser])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers
      })
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

  // Not logged in - show login prompt
  if (!isLoggedIn) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">سجّلي دخولكِ لعرض حجوزاتكِ</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                يمكنكِ عرض وإدارة حجوزاتكِ السابقة بعد تسجيل الدخول إلى حسابكِ.
              </p>
              <Button
                onClick={onOpenAuthModal}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 h-11 font-semibold transition-all duration-300 shadow-lg shadow-emerald-200"
              >
                <LogIn className="h-4 w-4 ml-2" />
                تسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
            </div>
            حجوزاتي
          </h2>
          <p className="text-sm text-muted-foreground mt-1">عرض وإدارة حجوزاتكِ المسجلة</p>
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
                    <span className="font-medium">{booking.seat.room.name}</span>
                    <span className="text-muted-foreground">-</span>
                    <Armchair className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">لوكر {booking.seat.seatNumber}</span>
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
          { label: 'القاعات', value: stats?.totalRooms || 0, icon: Building2, color: 'bg-emerald-600' },
          { label: 'إجمالي الحجوزات', value: stats?.totalBookings || 0, icon: CalendarDays, color: 'bg-teal-600' },
          { label: 'حجوزات قيد الانتظار', value: stats?.pendingBookings || 0, icon: Clock, color: 'bg-amber-500' },
          { label: 'المستخدمات', value: stats?.totalUsers || 0, icon: Users, color: 'bg-rose-500' }
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
              حجوزات حسب القاعة
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
                              هل أنتِ متأكدة من حذف &quot;{room.name}&quot;؟ سيتم حذف جميع اللوكرات والحجوزات المرتبطة.
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
                      <Armchair className="h-3.5 w-3.5" />
                      <span className="font-medium">{room._count.seats} لوكر</span>
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
                    <TableHead className="text-xs">القاعة</TableHead>
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
                      <TableCell className="text-xs">{booking.seat.room.name}</TableCell>
                      <TableCell className="text-xs font-mono">لوكر {booking.seat.seatNumber}</TableCell>
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
              <Label className="text-sm font-medium">السعة (عدد اللواكر)</Label>
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
              إضافة القاعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
