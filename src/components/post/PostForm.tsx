'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, MapPin, X } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Category } from '@/types'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const schema = z.object({
  title: z.string().min(1, 'イベント名は必須です').max(100, '100文字以内で入力してください'),
  description: z.string().min(1, '説明は必須です').max(2000, '2000文字以内で入力してください'),
  category: z.enum(['matsuri', 'yatai', 'event', 'kitchen_car'] as const),
  location_name: z.string().min(1, '場所名は必須です'),
  latitude: z.number({ required_error: '位置情報を設定してください' }),
  longitude: z.number({ required_error: '位置情報を設定してください' }),
  start_date: z.string().min(1, '開始日は必須です'),
  end_date: z.string().min(1, '終了日は必須です'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  website_url: z.string().url('正しいURLを入力してください').optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

const categories: { value: Category; label: string; color: string }[] = [
  { value: 'matsuri', label: '祭り', color: 'bg-red-500' },
  { value: 'yatai', label: '屋台', color: 'bg-orange-400' },
  { value: 'event', label: 'イベント', color: 'bg-blue-500' },
  { value: 'kitchen_car', label: 'キッチンカー', color: 'bg-green-600' },
]

export function PostForm() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'matsuri',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    },
  })

  const selectedCategory = watch('category')
  const lat = watch('latitude')
  const lng = watch('longitude')

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) {
      toast.error('画像は最大5枚まで')
      return
    }
    const newFiles = files.slice(0, 5 - images.length)
    setImages(prev => [...prev, ...newFiles])
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const detectLocation = () => {
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setValue('latitude', pos.coords.latitude, { shouldValidate: true })
        setValue('longitude', pos.coords.longitude, { shouldValidate: true })
        setDetectingLocation(false)
        toast.success('現在地を設定しました')
      },
      () => {
        toast.error('位置情報の取得に失敗しました')
        setDetectingLocation(false)
      }
    )
  }

  const uploadOneImage = async (postId: string, file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `posts/${postId}/${Date.now()}.${ext}`
    try {
      const uploadPromise = supabase.storage.from('post-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      )
      const { error } = await Promise.race([uploadPromise, timeoutPromise])
      if (error) return null
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
      return publicUrl
    } catch {
      return null
    }
  }

  const uploadImages = async (postId: string): Promise<string[]> => {
    if (images.length === 0) return []
    const results = await Promise.all(images.map(f => uploadOneImage(postId, f)))
    return results.filter((url): url is string => url !== null)
  }

  const onSubmit = async (data: FormData) => {
    if (!user) { toast.error('ログインが必要です'); return }
    setSubmitting(true)

    try {
      const postId = crypto.randomUUID()
      const imageUrls = await uploadImages(postId)

      const submitPromise = supabase.from('posts').insert({
        id: postId,
        user_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        location_name: data.location_name,
        latitude: data.latitude,
        longitude: data.longitude,
        start_date: data.start_date,
        end_date: data.end_date,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        website_url: data.website_url || null,
        images: imageUrls,
        is_approved: true,
      })
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('通信がタイムアウトしました')), 20000)
      )
      const { error } = await Promise.race([submitPromise, timeoutPromise])

      if (error) throw error

      toast.success('投稿しました！')
      router.push('/')
    } catch (err: any) {
      toast.error('投稿に失敗しました: ' + (err.message || '不明なエラー'))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-8">
      {/* カテゴリ選択 */}
      <div>
        <label className="block text-sm font-bold text-matsuri-dark mb-2">カテゴリ</label>
        <div className="grid grid-cols-4 gap-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setValue('category', cat.value)}
              className={`
                py-2.5 rounded-2xl text-xs font-bold text-white transition-all
                ${selectedCategory === cat.value
                  ? `${cat.color} shadow-md scale-105`
                  : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* イベント名 */}
      <div>
        <label className="block text-sm font-bold text-matsuri-dark mb-1.5">イベント名 *</label>
        <input
          {...register('title')}
          placeholder="例：〇〇夏祭り2024"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30 focus:border-matsuri-red transition-all"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      {/* 説明 */}
      <div>
        <label className="block text-sm font-bold text-matsuri-dark mb-1.5">説明 *</label>
        <textarea
          {...register('description')}
          placeholder="イベントの詳細情報を入力してください"
          rows={3}
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30 focus:border-matsuri-red transition-all resize-none"
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      {/* 場所 & 位置情報 */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-matsuri-dark">場所 *</label>
        <input
          {...register('location_name')}
          placeholder="例：代々木公園、渋谷駅前"
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30 focus:border-matsuri-red transition-all"
        />
        {errors.location_name && <p className="text-xs text-red-500 mt-1">{errors.location_name.message}</p>}

        <div className="flex gap-2">
          <input
            type="number"
            step="any"
            placeholder="緯度"
            value={lat || ''}
            onChange={e => setValue('latitude', parseFloat(e.target.value))}
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30"
          />
          <input
            type="number"
            step="any"
            placeholder="経度"
            value={lng || ''}
            onChange={e => setValue('longitude', parseFloat(e.target.value))}
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30"
          />
          <button
            type="button"
            onClick={detectLocation}
            disabled={detectingLocation}
            className="px-3 py-2.5 bg-matsuri-blue text-white rounded-2xl flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <MapPin size={14} />
            {detectingLocation ? '取得中' : '現在地'}
          </button>
        </div>
        {errors.latitude && <p className="text-xs text-red-500">{errors.latitude.message}</p>}
      </div>

      {/* 開催日 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-matsuri-dark mb-1.5">開始日 *</label>
          <input
            type="date"
            {...register('start_date')}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-matsuri-dark mb-1.5">終了日 *</label>
          <input
            type="date"
            {...register('end_date')}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30"
          />
        </div>
      </div>

      {/* 開催時間 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-matsuri-dark mb-1.5">開始時間</label>
          <input
            type="time"
            {...register('start_time')}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-matsuri-dark mb-1.5">終了時間</label>
          <input
            type="time"
            {...register('end_time')}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30"
          />
        </div>
      </div>

      {/* 画像 */}
      <div>
        <label className="block text-sm font-bold text-matsuri-dark mb-2">画像（最大5枚）</label>
        <div className="flex gap-2 flex-wrap">
          {imagePreviews.map((src, i) => (
            <div key={i} className="relative w-20 h-20">
              <Image src={src} alt="" fill className="object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {imagePreviews.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-matsuri-red hover:text-matsuri-red transition-colors"
            >
              <Camera size={20} />
              <span className="text-[10px] mt-1">追加</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>

      {/* 公式サイト */}
      <div>
        <label className="block text-sm font-bold text-matsuri-dark mb-1.5">公式サイトURL（任意）</label>
        <input
          {...register('website_url')}
          type="url"
          placeholder="https://..."
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-matsuri-red/30"
        />
        {errors.website_url && <p className="text-xs text-red-500 mt-1">{errors.website_url.message}</p>}
      </div>

      {/* 投稿ボタン */}
      <Button
        type="submit"
        size="lg"
        loading={submitting}
        className="w-full"
      >
        投稿する
      </Button>
    </form>
  )
}
