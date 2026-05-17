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

let loaderInstance: Loader | null = null

export function MapView({ posts, onMarkerClick, userLat, userLng }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)

  const initMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setMapError('Google Maps APIキーが設定されていません')
      return
    }

    if (!loaderInstance) {
      loaderInstance = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places'],
      })
    }

    await loaderInstance.load()

    const center =
      userLat && userLng && isValidCoord(userLat, userLng)
        ? { lat: userLat, lng: userLng }
        : DEFAULT_CENTER

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
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
  }, [userLat, userLng])

  useEffect(() => {
    initMap().catch(err => {
      console.error('Google Maps load error:', err)
      setMapError('マップの読み込みに失敗しました')
    })
  }, [initMap])

  // マーカー描画（表示範囲内 or 最大100件）
  useEffect(() => {
    if (!mapInstanceRef.current) return

    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const validPosts = posts.filter(p => isValidCoord(p.latitude, p.longitude))
    const toShow = validPosts.slice(0, 100)

    toShow.forEach(post => {
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

  // ユーザー位置マーカー
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
            loaderInstance = null
            mapInstanceRef.current = null
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
