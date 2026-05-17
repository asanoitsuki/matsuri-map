'use client'

import { useState, useEffect } from 'react'
import {
  User, Settings, LogOut, ChevronRight,
  FileText, Heart, Bookmark, Shield
} from 'lucide-react'
import Image from 'next/image'
import { PostCard } from '@/components/post/PostCard'
import { PostModal } from '@/components/post/PostModal'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Post } from '@/types'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function MyPage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts')
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setPostsLoading(false); return }
    fetchMyPosts()
  }, [user, activeTab])

  const fetchMyPosts = async () => {
    if (!user) return
    setPostsLoading(true)

    if (activeTab === 'posts') {
      const { data } = await supabase
        .from('posts')
        .select('*, users(id, username, avatar_url), likes_count:likes(count), comments_count:comments(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setMyPosts((data || []).map((p: any) => ({
        ...p,
        likes_count: p.likes_count?.[0]?.count ?? 0,
        comments_count: p.comments_count?.[0]?.count ?? 0,
      })))
    } else {
      const { data } = await supabase
        .from('likes')
        .select('post_id, posts(*, users(id, username, avatar_url), likes_count:likes(count), comments_count:comments(count))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setMyPosts(
        (data || [])
          .map((l: any) => l.posts)
          .filter(Boolean)
          .map((p: any) => ({
            ...p,
            likes_count: p.likes_count?.[0]?.count ?? 0,
            comments_count: p.comments_count?.[0]?.count ?? 0,
            is_liked: true,
          }))
      )
    }

    setPostsLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('ログアウトしました')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-matsuri-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
        <header className="glass-effect h-14 flex items-center px-4 border-b border-gray-100">
          <h1 className="text-base font-bold text-matsuri-dark">マイページ</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={36} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-matsuri-dark">ログインしてください</h2>
          <p className="text-sm text-gray-500 text-center">
            マイページではあなたの投稿やいいねを確認できます
          </p>
          <Button onClick={signInWithGoogle} size="lg" className="w-full max-w-xs">
            Googleでログイン
          </Button>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="glass-effect sticky top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-gray-100">
        <h1 className="text-base font-bold text-matsuri-dark">マイページ</h1>
        {user.is_admin && (
          <Link href="/admin" className="flex items-center gap-1 text-xs text-matsuri-red font-semibold">
            <Shield size={14} />
            管理
          </Link>
        )}
      </header>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {/* プロフィール */}
        <div className="bg-white p-5 mb-3">
          <div className="flex items-center gap-4 mb-5">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.username || ''}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover border-2 border-matsuri-red"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-matsuri-red/10 flex items-center justify-center">
                <User size={28} className="text-matsuri-red" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-matsuri-dark">{user.username}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* メニュー */}
          <div className="space-y-1">
            <MenuItem icon={<Settings size={18} />} label="設定" />
            <MenuItem icon={<Bookmark size={18} />} label="お気に入り" href="/favorites" />
            <MenuItem
              icon={<LogOut size={18} className="text-red-500" />}
              label="ログアウト"
              labelClass="text-red-500"
              onClick={handleSignOut}
            />
          </div>
        </div>

        {/* タブ */}
        <div className="flex bg-white mb-3 border-b border-gray-100">
          {[
            { key: 'posts', label: '投稿', icon: <FileText size={15} /> },
            { key: 'likes', label: 'いいね', icon: <Heart size={15} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors
                ${activeTab === tab.key
                  ? 'text-matsuri-red border-matsuri-red'
                  : 'text-gray-400 border-transparent'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 投稿/いいね一覧 */}
        <div className="p-3">
          {postsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-matsuri-red border-t-transparent rounded-full animate-spin" />
            </div>
          ) : myPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-gray-400">
              <span className="text-3xl mb-2">
                {activeTab === 'posts' ? '📝' : '❤️'}
              </span>
              <p className="text-sm">
                {activeTab === 'posts' ? 'まだ投稿していません' : 'いいねした投稿はありません'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {myPosts.map(post => (
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

      <BottomNav />
      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  )
}

function MenuItem({
  icon,
  label,
  labelClass = '',
  href,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  labelClass?: string
  href?: string
  onClick?: () => void
}) {
  const content = (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
      <span className="text-gray-500">{icon}</span>
      <span className={`flex-1 text-sm font-medium text-matsuri-dark ${labelClass}`}>{label}</span>
      <ChevronRight size={16} className="text-gray-300" />
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  if (onClick) return <button onClick={onClick} className="w-full text-left">{content}</button>
  return <div>{content}</div>
}
