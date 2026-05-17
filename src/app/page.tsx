'use client'

import { useState, useCallback } from 'react'
import { MapView } from '@/components/map/MapView'
import { FilterBar } from '@/components/filter/FilterBar'
import { PostModal } from '@/components/post/PostModal'
import { PostCard } from '@/components/post/PostCard'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { usePosts } from '@/hooks/usePosts'
import { useGeolocation } from '@/hooks/useGeolocation'
import { Post, FilterState } from '@/types'
import { ChevronUp, List, Map } from 'lucide-react'

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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header />

      <div className="flex-1 relative overflow-hidden">
        {/* 地図 / リスト切替 */}
        <div className="absolute top-0 right-3 z-20 flex items-center mt-16 gap-2">
          <button
            onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
            className="glass-effect shadow-md px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-matsuri-dark"
          >
            {viewMode === 'map' ? (
              <><List size={14} /> リスト</>
            ) : (
              <><Map size={14} /> 地図</>
            )}
          </button>
        </div>

        {viewMode === 'map' ? (
          <>
            {/* 地図 */}
            <div className="absolute inset-0">
              <MapView
                posts={posts}
                onMarkerClick={(post) => {
                  setSelectedPost(post)
                  setShowList(false)
                }}
                userLat={latitude}
                userLng={longitude}
              />
            </div>

            {/* フィルターバー */}
            <FilterBar
              filters={filters}
              onChange={setFilters}
              onLocateMe={handleLocateMe}
            />

            {/* 下部スライドアップパネル */}
            <div
              className={`
                absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transition-transform duration-300
                ${showList ? 'translate-y-0' : 'translate-y-[calc(100%-72px)]'}
              `}
              style={{ maxHeight: '60%' }}
            >
              {/* ハンドル */}
              <button
                onClick={() => setShowList(v => !v)}
                className="w-full flex flex-col items-center py-3 border-b border-gray-100"
              >
                <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
                <div className="flex items-center gap-2 text-sm font-semibold text-matsuri-dark">
                  <ChevronUp
                    size={16}
                    className={`transition-transform ${showList ? 'rotate-180' : ''}`}
                  />
                  <span>
                    {loading ? '読み込み中...' : `${posts.length}件のイベント`}
                  </span>
                </div>
              </button>

              {/* カードリスト */}
              <div className="overflow-y-auto h-full p-3 grid grid-cols-2 gap-3">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => setSelectedPost(post)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          /* リストビュー */
          <div className="h-full flex flex-col">
            <div className="p-3 border-b border-gray-100 bg-white relative">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                onLocateMe={handleLocateMe}
              />
              <div className="h-24" />
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
                    <PostCard
                      key={post.id}
                      post={post}
                      onClick={() => setSelectedPost(post)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      {/* 投稿詳細モーダル */}
      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  )
}
