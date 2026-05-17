'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { FilterBar } from '@/components/filter/FilterBar'
import { PostModal } from '@/components/post/PostModal'
import { PostCard } from '@/components/post/PostCard'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { usePosts } from '@/hooks/usePosts'
import { useGeolocation } from '@/hooks/useGeolocation'
import { Post, FilterState } from '@/types'
import { ChevronUp, List, Map } from 'lucide-react'

const MapView = dynamic(
  () => import('@/components/map/MapView').then(m => m.MapView),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" /> }
)

const defaultFilters: FilterState = {
  period: 'upcoming',
  categories: [],
  nearMe: false,
  searchQuery: '',
}

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [showList, setShowList] = useState(false)
  const { latitude, longitude, getCurrentPosition } = useGeolocation()
  const { posts, loading } = usePosts(filters, latitude, longitude)

  // 起動時に即座に位置情報をリクエスト
  useEffect(() => {
    getCurrentPosition()
  }, [])

  const handleLocateMe = useCallback(() => {
    getCurrentPosition()
    setFilters(f => ({ ...f, nearMe: !f.nearMe }))
  }, [getCurrentPosition])

  const handleMarkerClick = useCallback((post: Post) => {
    setSelectedPost(post)
    setShowList(false)
  }, [])

  const toggleButton = (
    <button
      onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
      className="glass-effect shadow-md px-3 py-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-semibold text-matsuri-dark whitespace-nowrap shrink-0"
    >
      {viewMode === 'map' ? <><List size={14} />リスト</> : <><Map size={14} />地図</>}
    </button>
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header />

      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'map' ? (
          <>
            <div className="absolute inset-0">
              <MapView
                posts={posts}
                onMarkerClick={handleMarkerClick}
                userLat={latitude}
                userLng={longitude}
              />
            </div>

            <FilterBar
              filters={filters}
              onChange={setFilters}
              onLocateMe={handleLocateMe}
              rightSlot={toggleButton}
            />

            {/* スライドアップパネル - BottomNavの上に配置 */}
            <div
              className="absolute left-0 right-0 bg-white rounded-t-3xl shadow-lg transition-transform duration-300"
              style={{
                bottom: 'calc(4.5rem + 0.5rem)', // BottomNav(h-16=4rem) + bottom-2(0.5rem) + 少し余裕
                maxHeight: '56%',
                transform: showList ? 'translateY(0)' : 'translateY(calc(100% - 60px))',
              }}
            >
              <button
                onClick={() => setShowList(v => !v)}
                className="w-full flex flex-col items-center py-2.5 border-b border-gray-100"
              >
                <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
                <div className="flex items-center gap-2 text-sm font-semibold text-matsuri-dark">
                  <ChevronUp size={16} className={`transition-transform ${showList ? 'rotate-180' : ''}`} />
                  {loading ? '読み込み中...' : `${posts.length}件のイベント`}
                </div>
              </button>
              <div className="overflow-y-auto p-3 grid grid-cols-2 gap-3" style={{ maxHeight: 'calc(56vh - 60px)' }}>
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col">
            <div className="bg-white border-b border-gray-100 relative">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                onLocateMe={handleLocateMe}
                rightSlot={toggleButton}
              />
              <div className="h-[118px]" />
            </div>
            <div className="flex-1 overflow-y-auto p-3" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-2 border-matsuri-red border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <span className="text-4xl mb-3">🎌</span>
                  <p className="text-sm">イベントが見つかりません</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  )
}
