'use client'

import { Bell, MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

export function Header() {
  const { user } = useAuth()

  return (
    <header className="glass-effect sticky top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-matsuri-red rounded-xl flex items-center justify-center">
          <MapPin size={18} className="text-white" fill="white" />
        </div>
        <span className="text-lg font-bold text-matsuri-dark tracking-tight">
          MatsuriMap
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell size={20} className="text-gray-600" />
        </button>

        {user?.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username || 'User'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover border-2 border-matsuri-red"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-500">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
