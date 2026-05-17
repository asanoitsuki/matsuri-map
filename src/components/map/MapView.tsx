'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Post, CATEGORY_COLORS } from '@/types'

interface MapViewProps {
  posts: Post[]
  onMarkerClick: (post: Post) => void
  userLat?: number | null
  userLng?: number | null
}

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 }

function isValidCoord(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  )
}

// Loader はモジュール単位でシングルトン
let loaderPromise: Promise<unknown> | null = null

function loadMapsApi(apiKey: string): Promise<unknown> {
  if (!loaderPromise) {
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    })
    loaderPromise = loader.load() as Promise<unknown>
  }
  return loaderPromise
}

export function MapView({ posts, onMarkerClick, userLat, userLng }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const initingRef = useRef(false) // 初期化中フラグ（レース条件防止）
  const [mapError, setMapError] = useState<string | null>(null)

  // 一度だけマップを初期化（位置情報には依存しない）
  useEffect(() => {
    const init = async () => {
      if (mapInstanceRef.current || initingRef.current || !mapRef.current) return
      initingRef.current = true

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          setMapError('Google Maps APIキーが設定されていません')
          return
        }

        await loadMapsApi(apiKey)

        // await後に再チェック（await中にコンポーネントが変わった場合の安全策）
        if (mapInstanceRef.current || !mapRef.current) return

        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: DEFAULT_CENTER,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          ],
        })
      } catch (err) {
        console.error('Google Maps load error:', err)
        setMapError('マップの読み込みに失敗しました')
      } finally {
        initingRef.current = false
      }
    }

    init()
  }, []) // 依存なし → 一度だけ実行

  // マーカー描画（最大100件・座標バリデーション付き）
  useEffect(() => {
    if (!mapInstanceRef.current) return

    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const validPosts = posts
      .filter(p => isValidCoord(p.latitude, p.longitude))
      .slice(0, 100)

    validPosts.forEach(post => {
      const color = CATEGORY_COLORS[post.category as keyof typeof CATEGORY_COLORS] ?? '#888888'

      const marker = new google.maps.Marker({
        position: { lat: post.latitude, lng: post.longitude },
        map: mapInstanceRef.current!,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
          scale: 10,
        },
        title: post.title,
      })

      marker.addListener('click', () => {
        onMarkerClick(post)
        mapInstanceRef.current?.panTo({ lat: post.latitude, lng: post.longitude })
      })

      markersRef.current.push(marker)
    })
  }, [posts, onMarkerClick])

  // ユーザー位置マーカーとマップ移動（位置情報取得後）
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  useEffect(() => {
    if (!mapInstanceRef.current || !userLat || !userLng) return
    if (!isValidCoord(userLat, userLng)) return

    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition({ lat: userLat, lng: userLng })
    } else {
      userMarkerRef.current = new google.maps.Marker({
        position: { lat: userLat, lng: userLng },
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 8,
        },
        zIndex: 999,
      })
    }

    mapInstanceRef.current.panTo({ lat: userLat, lng: userLng })
  }, [userLat, userLng])

  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 gap-3">
        <span className="text-4xl">🗺️</span>
        <p className="text-sm font-medium">{mapError}</p>
        <button
          onClick={() => {
            setMapError(null)
            loaderPromise = null
            mapInstanceRef.current = null
            initingRef.current = false
          }}
          className="px-4 py-2 bg-matsuri-red text-white rounded-full text-sm font-semibold"
        >
          再読み込み
        </button>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full" />
}
