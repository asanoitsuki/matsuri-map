'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Search, PlusCircle, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Map, label: 'マップ' },
  { href: '/search', icon: Search, label: '検索' },
  { href: '/post/new', icon: PlusCircle, label: '投稿', isMain: true },
  { href: '/favorites', icon: Heart, label: 'お気に入り' },
  { href: '/mypage', icon: User, label: 'マイページ' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-effect border-t border-gray-100 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.isMain) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="w-14 h-14 bg-matsuri-red rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 active:scale-95 transition-transform">
                  <Icon size={26} className="text-white" />
                </div>
                <span className="text-[10px] font-medium text-matsuri-red mt-1">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-colors active:bg-gray-100"
            >
              <Icon
                size={22}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-matsuri-red' : 'text-gray-400'
                )}
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-matsuri-red' : 'text-gray-400'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
