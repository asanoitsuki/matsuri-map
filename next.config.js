/** @type {import('next').NextConfig} */

// Capacitor iOS ビルド時は NEXT_BUILD_MODE=export を設定
const isCapacitorBuild = process.env.NEXT_BUILD_MODE === 'export'

const nextConfig = {
  // iOSアプリ用スタティックエクスポート（通常は無効）
  ...(isCapacitorBuild ? { output: 'export', trailingSlash: true } : {}),

  images: {
    // スタティックエクスポート時は外部画像最適化を無効化
    unoptimized: isCapacitorBuild,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
