'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { PostCard } from '@/components/post/PostCard'
import { PostModal } from '@/components/post/PostModal'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'

export default function FavoritesPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchSavedPosts()
  }, [user])

  const fetchSavedPosts = async () => {
    if (!user) return
    setLoading(true)

    const { data } = await supabase
      .from('saves')
      .select(`
        post_id,
        posts (
          *,
          users (id, username, avatar_url),
          likes_count:likes(count),
          comments_count:comments(count)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const savedPosts = (data || [])
      .map((s: any) => s.posts)
      .filter(Boolean)
      .map((p: any) => ({
        ...p,
        likes_count: p.likes_count?.[0]?.count ?? 0,
        comments_count: p.comments_count?.[0]?.count ?? 0,
        is_saved: true,
      }))

    setPosts(savedPosts)
    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-matsuri-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <Bookmark size={48} className="text-gray-300" />
          <h2 className="text-lg font-bold text-matsuri-dark">お気に入りリスト</h2>
          <p className="text-sm text-gray-500 text-center">
            ログインするとお気に入りを保存できます
          </p>
          <Button onClick={signInWithGoogle}>Googleでログイン</Button>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="glass-effect sticky top-0 z-40 h-14 flex items-center px-4 border-b border-gray-100">
        <h1 className="text-base font-bold text-matsuri-dark">お気に入り</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-matsuri-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Bookmark size={40} className="mb-3 opacity-40" />
            <p className="text-sm">保存済みのイベントはありません</p>
            <p className="text-xs mt-1">イベントのブックマークアイコンをタップして保存</p>
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

      <BottomNav />
      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  )
}
