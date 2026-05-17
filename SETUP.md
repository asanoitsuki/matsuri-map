# MatsuriMap セットアップガイド

---

## ① プロジェクトフォルダ構成

```
matsuri-map/
├── public/
│   ├── manifest.json            # PWAマニフェスト
│   └── icons/                   # アプリアイコン（自分で作成）
├── src/
│   ├── app/
│   │   ├── globals.css          # グローバルCSS
│   │   ├── layout.tsx           # ルートレイアウト
│   │   ├── page.tsx             # ホーム（地図）
│   │   ├── auth/callback/       # Google認証コールバック
│   │   ├── post/new/            # 投稿作成ページ
│   │   ├── search/              # 検索ページ
│   │   ├── favorites/           # お気に入りページ
│   │   ├── mypage/              # マイページ
│   │   └── admin/               # 管理者ページ
│   ├── components/
│   │   ├── layout/              # ヘッダー・ボトムナビ
│   │   ├── map/                 # Google Maps コンポーネント
│   │   ├── post/                # 投稿カード・モーダル・フォーム
│   │   ├── filter/              # フィルターバー
│   │   └── ui/                  # 共通UIコンポーネント
│   ├── hooks/                   # カスタムフック
│   ├── lib/supabase/            # Supabaseクライアント
│   ├── types/                   # TypeScript型定義
│   └── middleware.ts            # 認証ミドルウェア
├── supabase/
│   └── schema.sql               # DB スキーマ・RLS
├── capacitor.config.ts          # iOSアプリ設定
└── .env.local.example           # 環境変数サンプル
```

---

## ② 環境構築（ローカル開発）

### 手順1：依存関係のインストール

```bash
cd matsuri-map
npm install
```

### 手順2：環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開いて以下を入力：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 手順3：開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開く ✅

---

## ③ Supabase 設定手順

### Step 1：プロジェクト作成

1. https://supabase.com にアクセス
2. 「New project」をクリック
3. プロジェクト名に `matsuri-map` を入力
4. データベースパスワードを設定して「Create new project」

### Step 2：APIキーの取得

1. ダッシュボード左メニュー → **Settings** → **API**
2. 以下をコピーして `.env.local` に貼り付け：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 絶対に公開しない）

### Step 3：データベーススキーマ適用

1. ダッシュボード → **SQL Editor** → **New query**
2. `supabase/schema.sql` の中身を全コピーして貼り付け
3. **Run** ボタンをクリック ✅

### Step 4：Google認証を有効化

1. ダッシュボード → **Authentication** → **Providers**
2. **Google** を探してトグルをONに
3. GoogleのOAuthクライアントID・シークレットを入力（後述）
4. リダイレクトURL：`https://[project-id].supabase.co/auth/v1/callback`

### Step 5：管理者ユーザー設定

```sql
-- SQL Editorで実行（自分のメールアドレスに変更）
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

---

## ④ Google Maps API 設定手順

### Step 1：APIキー取得

1. https://console.cloud.google.com にアクセス
2. プロジェクトを作成（または既存を選択）
3. 左メニュー → **APIs & Services** → **Enable APIs and Services**
4. 以下を検索して有効化：
   - **Maps JavaScript API** ✅
   - **Places API** ✅
   - **Geocoding API** ✅

### Step 2：APIキーの設定

1. **APIs & Services** → **Credentials** → **Create Credentials** → **API key**
2. 作成したキーを **Restrict key** で制限：
   - Application restrictions：**HTTP referrers**
   - `localhost:3000/*` と `your-domain.vercel.app/*` を追加
3. `.env.local` の `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` に設定

### Step 3：Google OAuth設定（Supabase Google認証用）

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type：**Web application**
3. Authorized redirect URIs に追加：
   - `https://[your-project-id].supabase.co/auth/v1/callback`
4. クライアントIDとシークレットをSupabaseのGoogle Providerに貼り付け

---

## ⑤ Vercel デプロイ手順

### Step 1：GitHubにプッシュ

```bash
cd matsuri-map
git init
git add .
git commit -m "Initial commit: MatsuriMap"
git branch -M main
git remote add origin https://github.com/あなた/matsuri-map.git
git push -u origin main
```

### Step 2：Vercelにデプロイ

1. https://vercel.com にアクセスしてGitHubでログイン
2. **New Project** → GitHubリポジトリをインポート
3. **Framework Preset**：**Next.js** を選択
4. **Environment Variables** に以下を追加：

```
NEXT_PUBLIC_SUPABASE_URL        = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhb...
SUPABASE_SERVICE_ROLE_KEY       = eyJhb...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = AIzaSy...
NEXT_PUBLIC_APP_URL             = https://matsuri-map.vercel.app
```

5. **Deploy** をクリック → 1〜2分で公開完了 🎉

### Step 3：ドメイン確認後

- SupabaseのGoogle認証リダイレクトURLにVercelのURLを追加
- Google Cloud ConsoleのAuthorized redirect URIsにも追加

---

## ⑥ Capacitor を使った iOS アプリ化手順

> 前提：Mac + Xcode 15+ + Apple Developer アカウントが必要

### Step 1：Capacitorインストール

```bash
cd matsuri-map

# CapacitorコアとiOSプラグインをインストール
npm install @capacitor/core @capacitor/cli @capacitor/ios
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/geolocation

# Capacitor初期化
npx cap init MatsuriMap com.matsurimap.app --web-dir=out
```

### Step 2：next.config.js にスタティックエクスポート設定を追加

```js
// next.config.js に追記
const nextConfig = {
  output: 'export',  // ← この行を追加
  // ...既存の設定
}
```

### Step 3：ビルド & iOSプロジェクト追加

```bash
# Next.jsをスタティックビルド
npm run build

# iOSプロジェクト追加
npx cap add ios

# iOSにビルドをコピー
npx cap copy ios

# Xcodeで開く
npx cap open ios
```

### Step 4：Xcodeでの設定

Xcodeが開いたら：

1. **Signing & Capabilities** タブを開く
2. **Team** に自分のApple Developerアカウントを設定
3. **Bundle Identifier** を `com.matsurimap.app` に設定
4. **Info.plist** に位置情報利用許可を追加：
   ```xml
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>周辺のイベントを検索するために位置情報を使用します</string>
   ```
5. **アイコン設定**：`App/Assets.xcassets/AppIcon.appiconset` に各サイズのアイコンを配置

### Step 5：iPhoneでテスト

```bash
# iPhoneをMacに接続してXcodeで実機ビルド
# または Simulator でテスト
```

Xcode上部のデバイス選択から自分のiPhoneを選び、**▶ Run** をクリック

### Step 6：App Store 提出手順

#### 6-1：App Store Connect でアプリ作成

1. https://appstoreconnect.apple.com にアクセス
2. **My Apps** → **+** → **New App**
3. 入力事項：
   - Platform：iOS
   - Name：MatsuriMap
   - Primary Language：Japanese
   - Bundle ID：com.matsurimap.app
   - SKU：matsurimap-001

#### 6-2：スクリーンショット用意

- iPhone 6.7インチ：1290 × 2796 px（最低3枚）
- iPhone 6.5インチ：1242 × 2688 px
- シミュレーターでスクショ撮影 → Finder からドラッグ

#### 6-3：アーカイブ作成

```
Xcodeメニュー → Product → Archive
```

アーカイブ完了後 → **Distribute App** → **App Store Connect** → **Upload**

#### 6-4：審査提出

App Store Connect で：
1. アーカイブしたビルドを選択
2. スクリーンショット・説明・キーワード入力
3. **Submit for Review** をクリック

⏱ 審査期間：通常 24〜72時間

#### 6-5：審査ガイドライン確認事項

- ✅ プライバシーポリシーのURL設定（必須）
- ✅ 位置情報使用の理由明記
- ✅ UGCコンテンツのモデレーション機能（実装済み）
- ✅ 通報・削除機能（実装済み）

---

## トラブルシューティング

### Q: Google Mapsが表示されない
→ APIキーが正しく設定されているか確認。コンソールでエラーを確認。

### Q: ログインができない
→ SupabaseのGoogle OAuth設定とリダイレクトURLを確認。

### Q: 画像がアップロードできない
→ Supabase Storageの `post-images` バケットが作成されているか確認。RLSポリシーも確認。

### Q: Vercelビルドが失敗する
→ 環境変数がVercelに設定されているか確認。`NEXT_PUBLIC_` プレフィックスを忘れずに。

---

## 開発コマンド一覧

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run lint         # Lintチェック

npx cap copy ios     # Webビルドをiosにコピー
npx cap open ios     # Xcodeを開く
npx cap run ios      # iOSシミュレーターで実行
```
