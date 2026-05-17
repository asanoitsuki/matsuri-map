'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { PostCard } from '@/components/post/PostCard'
import { PostModal } from '@/components/post/PostModal'
import { BottomNav } from '@/components/layout/BottomNav'
import { usePosts } from '@/hooks/usePosts'
import { Post, FilterState, Category, CATEGORY_LABELS } from '@/types'
import { useDebounce } from '@/hooks/useDebounce'

const defaultFilters: FilterState = {
  period: 'all',
  categories: [],
  nearMe: false,
  searchQuery: '',
}

const categories: Category[] = ['matsuri', 'yatai', 'event', 'kitchen_car']

const categoryColors: Record<Category, string> = {
  matsuri: 'bg-red-500 text-white',
  yatai: 'bg-orange-400 text-white',
  event: 'bg-blue-500 text-white',
  kitchen_car: 'bg-green-600 text-white',
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const debouncedQuery = useDebounce(query, 400)

  const hasFilter = debouncedQuery.length > 0 || selectedCategory !== null
  const filters: FilterState = {
    ...defaultFilters,
    searchQuery: debouncedQuery,
    categories: selectedCategory ? [selectedCategory] : [],
  }

  // クエリもカテゴリも選択されていない場合はfetchしない
  const { posts, loading } = usePosts(filters, null, null, !hasFilter)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2.5">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="search"
              placeholder="イベント名・場所で検索"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              autoFocus
            />
            {query.length > 0 && (
              <button onClick={() => setQuery('')}>
                <X size={15} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
              !selectedCategory
                ? 'bg-matsuri-dark text-white border-matsuri-dark'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            すべて
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(c => c === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedCategory === cat
                  ? categoryColors[cat] + ' border-transparent'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {!hasFilter ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-sm font-medium">キーワードまたはカテゴリで検索</p>
            <p className="text-xs mt-1">祭り・場所名・イベント名など</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-matsuri-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <span className="text-4xl mb-3">😢</span>
            <p className="text-sm">「{query || CATEGORY_LABELS[selectedCategory!]}」の結果が見つかりません</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3 font-medium">{posts.length}件見つかりました</p>
            <div className="grid grid-cols-2 gap-3">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => setSelectedPost(post)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  )
}
