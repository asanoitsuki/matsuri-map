'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post, FilterState } from '@/types'
import { isEventToday, isEventThisWeek, getDistanceKm } from '@/lib/utils'

export function usePosts(filters: FilterState, userLat?: number | null, userLng?: number | null) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      let query = supabase
        .from('posts')
        .select(`
          *,
          users (id, username, avatar_url),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories)
      }

      if (filters.searchQuery) {
        query = query.or(
          `title.ilike.%${filters.searchQuery}%,location_name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
        )
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      let filtered = (data || []).map((post: any) => ({
        ...post,
        likes_count: post.likes_count?.[0]?.count ?? 0,
        comments_count: post.comments_count?.[0]?.count ?? 0,
      }))

      if (filters.period === 'today') {
        filtered = filtered.filter((p: Post) => isEventToday(p.start_date, p.end_date))
      } else if (filters.period === 'week') {
        filtered = filtered.filter((p: Post) => isEventThisWeek(p.start_date, p.end_date))
      }

      if (filters.nearMe && userLat != null && userLng != null) {
        filtered = filtered
          .filter((p: Post) => getDistanceKm(userLat, userLng, p.latitude, p.longitude) <= 10)
          .sort((a: Post, b: Post) => {
            const distA = getDistanceKm(userLat!, userLng!, a.latitude, a.longitude)
            const distB = getDistanceKm(userLat!, userLng!, b.latitude, b.longitude)
            return distA - distB
          })
      }

      if (user) {
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)

        const { data: saves } = await supabase
          .from('saves')
          .select('post_id')
          .eq('user_id', user.id)

        const likedIds = new Set((likes || []).map((l: any) => l.post_id))
        const savedIds = new Set((saves || []).map((s: any) => s.post_id))

        filtered = filtered.map((p: Post) => ({
          ...p,
          is_liked: likedIds.has(p.id),
          is_saved: savedIds.has(p.id),
        }))
      }

      setPosts(filtered)
    } catch (err: any) {
      setError(err.message || '投稿の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [filters, userLat, userLng])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return { posts, loading, error, refetch: fetchPosts }
}
