'use client'

import { ReactNode } from 'react'
import { Locate } from 'lucide-react'
import { Category, FilterState, CATEGORY_LABELS, FilterPeriod } from '@/types'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onLocateMe: () => void
  rightSlot?: ReactNode
}

const periods: { value: FilterPeriod; label: string }[] = [
  { value: 'upcoming', label: 'これから' },
  { value: 'week', label: '1週間以内' },
  { value: 'month', label: '1か月以内' },
  { value: '3months', label: '3か月以内' },
  { value: '6months', label: '半年以内' },
  { value: 'all', label: 'すべて' },
  { value: 'past', label: '終了済み' },
]

const categories: Category[] = ['matsuri', 'yatai', 'event', 'kitchen_car']

const categoryColors: Record<Category, string> = {
  matsuri: 'bg-red-500 text-white border-red-500',
  yatai: 'bg-orange-400 text-white border-orange-400',
  event: 'bg-blue-500 text-white border-blue-500',
  kitchen_car: 'bg-green-600 text-white border-green-600',
}

export function FilterBar({ filters, onChange, onLocateMe, rightSlot }: FilterBarProps) {
  const toggleCategory = (cat: Category) => {
    const current = filters.categories
    const next = current.includes(cat)
      ? current.filter(c => c !== cat)
      : [...current, cat]
    onChange({ ...filters, categories: next })
  }

  return (
    <div className="absolute top-2 left-0 right-0 z-10 px-3 space-y-1.5">
      {/* 検索バー + 右スロット */}
      <div className="flex items-center gap-2">
        <div className="flex-1 glass-effect rounded-2xl shadow-md flex items-center gap-2 px-3 py-2.5">
          <input
            type="search"
            placeholder="祭り・場所を検索..."
            value={filters.searchQuery}
            onChange={e => onChange({ ...filters, searchQuery: e.target.value })}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <button
            onClick={onLocateMe}
            className={cn(
              'p-1.5 rounded-xl transition-colors shrink-0',
              filters.nearMe ? 'bg-matsuri-red text-white' : 'bg-gray-100 text-gray-500'
            )}
          >
            <Locate size={15} />
          </button>
        </div>
        {rightSlot}
      </div>

      {/* 期間フィルター */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => onChange({ ...filters, period: p.value })}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shadow-sm',
              filters.period === p.value
                ? 'bg-matsuri-dark text-white border-matsuri-dark'
                : 'bg-white text-gray-600 border-gray-200'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* カテゴリフィルター */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => onChange({ ...filters, categories: [] })}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shadow-sm',
            filters.categories.length === 0
              ? 'bg-matsuri-dark text-white border-matsuri-dark'
              : 'bg-white text-gray-600 border-gray-200'
          )}
        >
          すべて
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shadow-sm',
              filters.categories.includes(cat)
                ? categoryColors[cat]
                : 'bg-white text-gray-600 border-gray-200'
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
    </div>
  )
}
