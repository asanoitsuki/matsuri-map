'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PostForm } from '@/components/post/PostForm'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export default function NewPostPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-matsuri-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-gray-50">
        <span className="text-5xl">🎌</span>
        <h2 className="text-xl font-bold text-matsuri-dark">ログインが必要です</h2>
        <p className="text-sm text-gray-500 text-center">
          イベントを投稿するにはGoogleアカウントでログインしてください
        </p>
        <Button onClick={signInWithGoogle} size="lg">
          Googleでログイン
        </Button>
        <button onClick={() => router.back()} className="text-sm text-gray-400">
          戻る
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* ヘッダー */}
      <header className="glass-effect sticky top-0 z-40 h-14 flex items-center gap-3 px-4 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} className="text-matsuri-dark" />
        </button>
        <h1 className="text-base font-bold text-matsuri-dark">イベントを投稿</h1>
      </header>

      {/* フォーム */}
      <div className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <PostForm />
      </div>

      <BottomNav />
    </div>
  )
}
