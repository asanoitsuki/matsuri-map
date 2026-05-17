'use client'

import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Post, CATEGORY_COLORS } from '@/types'

interface MapViewProps {
  posts: Post[]
  onMarkerClick: (post: Post) => void
  userLat?: number | null
  userLng?: number | null
}

export function MapView({ posts, onMarkerClick, userLat, userLng }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const userMarkerRef = useRef<google.maps.Marker | null>(null)

  // マップ初期化（一度だけ）
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
    }).load().then(() => {
      if (mapInstanceRef.current || !mapRef.current) return
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: 35.6762, lng: 139.6503 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
    })
  }, [])

  // マーカー描画
  useEffect(() => {
    if (!mapInstanceRef.current) return
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    posts.slice(0, 100).forEach(post => {
      if (!isFinite(post.latitude) || !isFinite(post.longitude)) return
      const color = CATEGORY_COLORS[post.category as keyof typeof CATEGORY_COLORS] ?? '#888888'
      const marker = new google.maps.Marker({
        position: { lat: post.latitude, lng: post.longitude },
        map: mapInstanceRef.current!,
        icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2, scale: 10 },
        title: post.title,
      })
      marker.addListener('click', () => {
        onMarkerClick(post)
        mapInstanceRef.current?.panTo({ lat: post.latitude, lng: post.longitude })
      })
      markersRef.current.push(marker)
    })
  }, [posts, onMarkerClick])

  // 現在地マーカー
  useEffect(() => {
    if (!mapInstanceRef.current || !userLat || !userLng) return
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition({ lat: userLat, lng: userLng })
    } else {
      userMarkerRef.current = new google.maps.Marker({
        position: { lat: userLat, lng: userLng },
        map: mapInstanceRef.current,
        icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: '#4285F4', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3, scale: 8 },
        zIndex: 999,
      })
    }
    mapInstanceRef.current.panTo({ lat: userLat, lng: userLng })
  }, [userLat, userLng])

  return <div ref={mapRef} className="w-full h-full" />
}
