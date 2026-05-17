'use client'

import { useState, useCallback } from 'react'
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
  period: 'all',
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

  const handleLocateMe = useCallback(() => {
    getCurrentPosition()
    setFilters(f => ({ ...f, nearMe: !f.nearMe }))
  }, [getCurrentPosition])

  const handleMarkerClick = useCallback((post: Post) => {
    setSelectedPost(post)
    setShowList(false)
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header />

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute top-2 right-3 z-20 mt-16">
          <button
            onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
            className="glass-effect shadow-md px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-matsuri-dark"
          >
            {viewMode === 'map' ? <><List size={14} />リスト</> : <><Map size={14} />地図</>}
          </button>
        </div>

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
            />

            {/* スライドアップパネル */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transition-transform duration-300 shadow-lg`}
              style={{
                maxHeight: '60%',
                transform: showList ? 'translateY(0)' : 'translateY(calc(100% - 72px))',
              }}
            >
              <button
                onClick={() => setShowList(v => !v)}
                className="w-full flex flex-col items-center py-3 border-b border-gray-100"
              >
                <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
                <div className="flex items-center gap-2 text-sm font-semibold text-matsuri-dark">
                  <ChevronUp size={16} className={`transition-transform ${showList ? 'rotate-180' : ''}`} />
                  {loading ? '読み込み中...' : `${posts.length}件のイベント`}
                </div>
              </button>
              <div className="overflow-y-auto p-3 grid grid-cols-2 gap-3" style={{ maxHeight: 'calc(60vh - 72px)' }}>
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col">
            <div className="relative bg-white border-b border-gray-100">
              <FilterBar filters={filters} onChange={setFilters} onLocateMe={handleLocateMe} />
              <div className="h-28" />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
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
