'use client'

import { useState, useEffect } from 'react'
import { Shield, Trash2, AlertTriangle, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { BottomNav } from '@/components/layout/BottomNav'
import { Post } from '@/types'
import { CategoryBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ReportWithPost {
  id: string
  reason: string
  created_at: string
  posts: Post
  users: { username: string; email: string }
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [reports, setReports] = useState<ReportWithPost[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<'reports' | 'posts'>('reports')
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      router.replace('/')
    }
  }, [user, loading])

  useEffect(() => {
    if (user?.is_admin) {
      fetchData()
    }
  }, [user, activeTab])

  const fetchData = async () => {
    setDataLoading(true)
    if (activeTab === 'reports') {
      const { data } = await supabase
        .from('reports')
        .select('*, posts(*), users(username, email)')
        .order('created_at', { ascending: false })
      setReports(data || [])
    } else {
      const { data } = await supabase
        .from('posts')
        .select('*, users(id, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50)
      setPosts(data || [])
    }
    setDataLoading(false)
  }

  const deletePost = async (postId: string) => {
    if (!confirm('この投稿を削除しますか？')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (!error) {
      toast.success('削除しました')
      setPosts(p => p.filter(post => post.id !== postId))
      setReports(r => r.filter(rep => rep.posts?.id !== postId))
    }
  }

  const dismissReport = async (reportId: string) => {
    await supabase.from('reports').delete().eq('id', reportId)
    setReports(r => r.filter(rep => rep.id !== reportId))
    toast.success('通報を却下しました')
  }

  if (loading || !user?.is_admin) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="glass-effect sticky top-0 z-40 h-14 flex items-center gap-2 px-4 border-b border-gray-100">
        <Shield size={20} className="text-matsuri-red" />
        <h1 className="text-base font-bold text-matsuri-dark">管理画面</h1>
      </header>

      {/* タブ */}
      <div className="flex bg-white border-b border-gray-100">
        {[
          { key: 'reports', label: `通報 (${reports.length})` },
          { key: 'posts', label: '投稿管理' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'text-matsuri-red border-matsuri-red'
                : 'text-gray-400 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {dataLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-matsuri-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'reports' ? (
          reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Check size={32} className="mb-2 text-green-400" />
              <p className="text-sm">通報はありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="bg-white rounded-2xl p-4 card-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-orange-500" />
                      <span className="text-xs font-semibold text-orange-500">通報</span>
                      {report.posts && <CategoryBadge category={report.posts.category} />}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(report.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <h3 className="text-sm font-bold text-matsuri-dark mb-1">{report.posts?.title}</h3>
                  <p className="text-xs text-gray-600 bg-red-50 rounded-xl px-3 py-2 mb-3">
                    <span className="font-semibold">理由：</span>{report.reason}
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    通報者：{report.users?.username || report.users?.email}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deletePost(report.posts?.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white text-xs font-semibold rounded-xl"
                    >
                      <Trash2 size={13} />
                      投稿を削除
                    </button>
                    <button
                      onClick={() => dismissReport(report.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl"
                    >
                      <X size={13} />
                      却下
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl p-4 card-shadow flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CategoryBadge category={post.category} />
                  </div>
                  <p className="text-sm font-semibold text-matsuri-dark truncate">{post.title}</p>
                  <p className="text-xs text-gray-500 truncate">{post.location_name}</p>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  className="p-2 bg-red-50 text-red-500 rounded-xl shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
