export type Category = 'matsuri' | 'yatai' | 'event' | 'kitchen_car'

export const CATEGORY_LABELS: Record<Category, string> = {
  matsuri: '祭り',
  yatai: '屋台',
  event: 'イベント',
  kitchen_car: 'キッチンカー',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  matsuri: '#E63946',
  yatai: '#F4A261',
  event: '#457B9D',
  kitchen_car: '#2D9B5E',
}

export const CATEGORY_BG: Record<Category, string> = {
  matsuri: 'bg-red-500',
  yatai: 'bg-orange-400',
  event: 'bg-blue-500',
  kitchen_car: 'bg-green-600',
}

export interface User {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  title: string
  description: string
  category: Category
  location_name: string
  latitude: number
  longitude: number
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  website_url: string | null
  images: string[]
  is_approved: boolean
  created_at: string
  updated_at: string
  users?: User
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
  is_saved?: boolean
}

export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Save {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  updated_at: string
  users?: User
}

export interface Report {
  id: string
  user_id: string
  post_id: string
  reason: string
  created_at: string
}

export type FilterPeriod = 'upcoming' | 'week' | 'month' | '3months' | 'past'

export interface FilterState {
  period: FilterPeriod
  categories: Category[]
  nearMe: boolean
  searchQuery: string
}
