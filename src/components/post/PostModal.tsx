'use client'

import { useState, useEffect } from 'react'
import {
  Heart, MessageCircle, MapPin, Calendar, Clock,
  ExternalLink, Bookmark, Flag, X, Send, ChevronLeft, ChevronRight
} from 'lucide-react'
import Image from 'next/image'
import { Post, Comment } from '@/types'
import { CategoryBadge, TodayBadge } from '@/components/ui/Badge'
import { formatDateRange, isEventToday } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface PostModalProps {
  post: Post | null
  onClose: () => void
}

export function PostModal({ post, onClose }: PostModalProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const [reportReason, setReportReason] = useState('')
  const [showReportForm, setShowReportForm] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!post) return
    setIsLiked(post.is_liked ?? false)
    setIsSaved(post.is_saved ?? false)
    setLikesCount(post.likes_count ?? 0)
    setImageIndex(0)
    fetchComments()
  }, [post?.id])

  const fetchComments = async () => {
    if (!post) return
    const { data } = await supabase
      .from('comments')
      .select('*, users(id, username, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  const handleLike = async () => {
    if (!user) { toast.error('ログインが必要です'); return }
    if (isLiked) {
      await Promise.all([
        supabase.from('likes').delete().match({ user_id: user.id, post_id: post!.id }),
        supabase.from('saves').delete().match({ user_id: user.id, post_id: post!.id }),
      ])
      setIsLiked(false)
      setIsSaved(false)
      setLikesCount(c => c - 1)
      toast.success('お気に入りから削除しました')
    } else {
      await Promise.all([
        supabase.from('likes').insert({ user_id: user.id, post_id: post!.id }),
        supabase.from('saves').insert({ user_id: user.id, post_id: post!.id }),
      ])
      setIsLiked(true)
      setIsSaved(true)
      setLikesCount(c => c + 1)
      toast.success('お気に入りに追加しました ❤️')
    }
  }

  const handleSave = async () => {
    if (!user) { toast.error('ログインが必要です'); return }
    if (isSaved) {
      await supabase.from('saves').delete().match({ user_id: user.id, post_id: post!.id })
      setIsSaved(false)
      toast.success('お気に入りから削除しました')
    } else {
      await supabase.from('saves').insert({ user_id: user.id, post_id: post!.id })
      setIsSaved(true)
      toast.success('お気に入りに追加しました')
    }
  }

  const handleComment = async () => {
    if (!user) { toast.error('ログインが必要です'); return }
    if (!commentText.trim()) return
    setSubmittingComment(true)
    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      post_id: post!.id,
      content: commentText.trim(),
    })
    if (!error) {
      setCommentText('')
      await fetchComments()
    }
    setSubmittingComment(false)
  }

  const handleReport = async () => {
    if (!user) { toast.error('ログインが必要です'); return }
    if (!reportReason.trim()) return
    await supabase.from('reports').insert({
      user_id: user.id,
      post_id: post!.id,
      reason: reportReason,
    })
    toast.success('通報しました')
    setShowReportForm(false)
    setReportReason('')
  }

  if (!post) return null

  const todayEvent = isEventToday(post.start_date, post.end_date)
  const images = post.images || []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />
      <div className="relative bg-white w-full max-h-[92vh] sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col animate-slide-up">
        {/* 画像スライダー */}
        <div className="relative bg-gray-100 h-56 shrink-0">
          {images.length > 0 ? (
            <>
              <Image
                src={images[imageIndex]}
                alt={post.title}
                fill
                className="object-cover"
                sizes="100vw"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex(i => Math.max(0, i - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setImageIndex(i => Math.min(images.length - 1, i + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === imageIndex ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-6xl opacity-20">🎌</span>
            </div>
          )}

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>

          {/* バッジ */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <CategoryBadge category={post.category} />
            {todayEvent && <TodayBadge />}
          </div>
        </div>

        {/* スクロールコンテンツ */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* 投稿者 */}
            {post.users && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {post.users.avatar_url ? (
                    <Image src={post.users.avatar_url} alt="" width={28} height={28} className="object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-gray-500">{post.users.username?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium">{post.users.username || 'ユーザー'}</span>
              </div>
            )}

            {/* タイトル & アクション */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-matsuri-dark leading-tight flex-1">{post.title}</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleSave} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <Bookmark size={20} className={isSaved ? 'text-matsuri-accent fill-matsuri-accent' : 'text-gray-400'} />
                </button>
                <button onClick={() => setShowReportForm(!showReportForm)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <Flag size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* メタ情報 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={15} className="text-matsuri-red shrink-0" />
                <span className="text-sm">{post.location_name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={15} className="text-matsuri-blue shrink-0" />
                <span className="text-sm">{formatDateRange(post.start_date, post.end_date)}</span>
              </div>
              {(post.start_time || post.end_time) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm">
                    {post.start_time && post.end_time
                      ? `${post.start_time} 〜 ${post.end_time}`
                      : post.start_time || post.end_time}
                  </span>
                </div>
              )}
            </div>

            {/* 説明 */}
            {post.description && (
              <p className="text-sm text-gray-700 leading-relaxed">{post.description}</p>
            )}

            {/* 公式サイト */}
            {post.website_url && (
              <a
                href={post.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-matsuri-blue text-sm font-medium hover:underline"
              >
                <ExternalLink size={14} />
                公式サイトを見る
              </a>
            )}

            {/* いいね */}
            <div className="flex items-center gap-4 py-3 border-t border-b border-gray-100">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 font-medium text-sm active:scale-110 transition-transform"
              >
                <Heart size={22} className={isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
                <span className={isLiked ? 'text-red-500' : 'text-gray-500'}>{likesCount} いいね</span>
              </button>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <MessageCircle size={20} />
                <span>{comments.length} コメント</span>
              </div>
            </div>

            {/* 通報フォーム */}
            {showReportForm && (
              <div className="bg-red-50 rounded-2xl p-3 space-y-2">
                <p className="text-sm font-semibold text-red-700">通報理由を入力</p>
                <textarea
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  placeholder="通報理由を具体的に入力してください"
                  className="w-full text-sm border border-red-200 rounded-xl p-2 resize-none outline-none focus:ring-2 focus:ring-red-300"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={handleReport} className="flex-1 bg-red-500 text-white text-sm font-semibold py-2 rounded-xl">
                    通報する
                  </button>
                  <button onClick={() => setShowReportForm(false)} className="px-4 text-sm text-gray-500 py-2 rounded-xl bg-white border">
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* コメント一覧 */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-matsuri-dark">コメント</h3>
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">まだコメントはありません</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                      {comment.users?.avatar_url ? (
                        <Image src={comment.users.avatar_url} alt="" width={32} height={32} className="object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-gray-500">
                          {comment.users?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2">
                      <p className="text-xs font-semibold text-matsuri-dark">{comment.users?.username || 'ユーザー'}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="h-4" />
          </div>
        </div>

        {/* コメント入力 */}
        <div className="shrink-0 border-t border-gray-100 p-3 flex gap-2 glass-effect">
          <input
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            placeholder="コメントを入力..."
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30"
          />
          <button
            onClick={handleComment}
            disabled={submittingComment || !commentText.trim()}
            className="w-10 h-10 bg-matsuri-red rounded-2xl flex items-center justify-center disabled:opacity-40 shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
