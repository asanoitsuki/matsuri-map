'use client'

import { Category, CATEGORY_LABELS, CATEGORY_BG } from '@/types'

interface BadgeProps {
  category: Category
  size?: 'sm' | 'md'
}

export function CategoryBadge({ category, size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  const bg = CATEGORY_BG[category as keyof typeof CATEGORY_BG] ?? 'bg-gray-400'
  const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category
  return (
    <span className={`inline-flex items-center rounded-full font-semibold text-white ${bg} ${sizeClass}`}>
      {label}
    </span>
  )
}

interface TodayBadgeProps {
  className?: string
}

export function TodayBadge({ className = '' }: TodayBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white bg-red-500 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      開催中
    </span>
  )
}
