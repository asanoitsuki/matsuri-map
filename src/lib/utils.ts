import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { type Category, CATEGORY_COLORS } from '@/types'

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'M月d日(E)', { locale: ja })
  } catch {
    return dateStr
  }
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDate(startDate)
  return `${formatDate(startDate)} 〜 ${formatDate(endDate)}`
}

export function isEventToday(startDate: string, endDate: string): boolean {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const today = new Date()
  return today >= start && today <= end
}

export function isEventThisWeek(startDate: string, endDate: string): boolean {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  return start <= nextWeek && end >= today
}

export function getCategoryMarkerColor(category: Category): string {
  return CATEGORY_COLORS[category]
}

export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
