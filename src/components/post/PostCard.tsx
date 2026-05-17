'use client'

import { Heart, MessageCircle, MapPin, Calendar, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { Post } from '@/types'
import { CategoryBadge, TodayBadge } from '@/components/ui/Badge'
import { formatDateRange, isEventToday } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface PostCardProps {
  post: Post
  onClick: () => void
  onLikeUpdate?: (postId: string, liked: boolean, count: number) => void
}

export function PostCard({ post, onClick, onLikeUpdate }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [liking, setLiking] = useState(false)
  const supabase = createClient()
  const todayEvent = isEventToday(post.start_date, post.end_date)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (liking) return
    setLiking(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('いいねするにはログインが必要です')
      setLiking(false)
      return
    }

    try {
      if (isLiked) {
        await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id })
        setIsLiked(false)
        setLikesCount(c => c - 1)
        onLikeUpdate?.(post.id, false, likesCount - 1)
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: post.id })
        setIsLiked(true)
        setLikesCount(c => c + 1)
        onLikeUpdate?.(post.id, true, likesCount + 1)
      }
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setLiking(false)
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl card-shadow overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* 画像 */}
      {post.images && post.images.length > 0 ? (
        <div className="relative h-40 bg-gray-100">
          <Image
            src={post.images[0]}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute top-2 left-2 flex gap-1">
            <CategoryBadge category={post.category} />
            {todayEvent && <TodayBadge />}
          </div>
        </div>
      ) : (
        <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
          <span className="text-4xl opacity-30">🎌</span>
          <div className="absolute top-2 left-2 flex gap-1">
            <CategoryBadge category={post.category} />
            {todayEvent && <TodayBadge />}
          </div>
        </div>
      )}

      {/* コンテンツ */}
      <div className="p-3">
        <h3 className="font-bold text-matsuri-dark text-sm line-clamp-1 mb-0.5">{post.title}</h3>
        {post.users?.username && (
          <p className="text-[10px] text-gray-400 mb-1">by {post.users.username}</p>
        )}

        <div className="flex items-center gap-1 text-gray-500 mb-1">
          <MapPin size={11} className="shrink-0" />
          <span className="text-xs line-clamp-1">{post.location_name}</span>
        </div>

        <div className="flex items-center gap-1 text-gray-500 mb-2">
          <Calendar size={11} className="shrink-0" />
          <span className="text-xs">{formatDateRange(post.start_date, post.end_date)}</span>
        </div>

        {/* アクション */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-gray-500 active:scale-110 transition-transform"
            >
              <Heart
                size={16}
                className={isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'}
              />
              <span className="text-xs font-medium">{likesCount}</span>
            </button>
            <div className="flex items-center gap-1 text-gray-500">
              <MessageCircle size={16} className="text-gray-400" />
              <span className="text-xs font-medium">{post.comments_count ?? 0}</span>
            </div>
          </div>

          {post.website_url && (
            <a
              href={post.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <ExternalLink size={14} className="text-gray-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
