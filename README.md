# 不動産投資家アプリ (Real Estate Investor)

## 🏢 プロジェクト概要

不動産投資家向けのAI活用型利回り計算Webアプリ・モバイルアプリ。
物件情報を入力するだけで、AIが周辺相場を分析し、詳細な投資判断指標を自動計算します。

## 🎯 主要機能

### コア機能
- **物件情報入力**：住所、価格、物件種別、大きさなどの基本情報
- **AI相場分析**：周辺の賃料相場・売買価格相場を自動取得
- **自動計算**：
  - 表面利回り
  - 実質利回り
  - キャッシュフロー
  - CCR（自己資金配当率）
  - 固定資産税・都市計画税
- **詳細レポート**：PDF出力、グラフ表示
- **複数物件比較**：最大10件の物件を横並び比較

### 対応物件種別
- 1棟マンション
- 1棟アパート
- 1棟ビル
- 区分マンション
- 戸建て
- テラスハウス

## 💰 マネタイズ戦略

### 3つの収益源

1. **サブスクリプション収益**
   - フリープラン：¥0（月6回まで）
   - スタンダード：¥980/月のみ
   - プレミアム：¥1,980/月 または ¥19,800/年

2. **アフィリエイト収益**
   - 不動産業者への送客
   - 金融機関のローン紹介
   - 管理会社紹介

3. **広告プラットフォーム収益**
   - バナー広告枠
   - おすすめ物件枠
   - 特集記事枠

## 🚀 技術スタック

- **フロントエンド**：React Native + Expo
- **バックエンド**：Next.js + Supabase
- **AI**：Claude API
- **決済**：Stripe
- **データベース**：PostgreSQL (Supabase)
- **ホスティング**：Vercel + Expo Application Services

## 📱 プラットフォーム

- **Web版**（デスクトップ・モバイルブラウザ）
- **iOS アプリ**（App Store）
- **Android アプリ**（Google Play）

## 💵 初期投資

**合計：約¥20,000〜¥40,000**

- Apple Developer Program：¥15,600/年
- Google Play Console：¥3,400（初回のみ）
- ドメイン：¥1,500/年
- UIテンプレート（オプション）：¥5,000〜¥20,000

## 📊 収益予測（1年後）

- **月間売上**：約¥2,000,000
- **粗利**：約¥1,900,000
- **内訳**：
  - サブスク：¥492,000
  - アフィリエイト：¥800,000
  - 広告収益：¥740,000

## 🤖 AIエージェント組織

このプロジェクトは**10種類の専門特化型AIエージェント**による協働開発体制を採用しています。

### エージェント構成
- **Layer 1 (マネジメント)**: Project Manager Agent
- **Layer 2 (設計)**: Architect Agent, Design Agent
- **Layer 3 (実装)**: Frontend Agent, Backend Agent, AI Integration Agent
- **Layer 4 (品質保証)**: Test Agent, Code Reviewer Agent
- **Layer 5 (運用)**: DevOps Agent, Documentation Agent

詳細は [docs/agent-organization.md](docs/agent-organization.md) を参照してください。

## 📁 ドキュメント構成

```
real-estate-investor/
├── README.md（本ファイル）
├── docs/
│   ├── agent-organization.md        # 🤖 AIエージェント組織設計
│   ├── specs/
│   │   ├── project-overview.md         # 詳細な概要
│   │   ├── features.md                 # 機能仕様
│   │   ├── input-requirements.md       # 入力情報仕様
│   │   ├── calculation-logic.md        # 計算ロジック
│   │   └── monetization-strategy.md    # マネタイズ詳細
│   ├── design/
│   │   └── （UIデザイン・ワイヤーフレーム）
│   └── technical/
│       ├── tech-stack.md               # 技術選定
│       ├── database-design.md          # DB設計
│       └── api-design.md               # API設計
├── planning/
│   ├── roadmap.md                      # 開発ロードマップ
│   ├── pricing-strategy.md             # 価格戦略
│   └── cost-analysis.md                # コスト分析
└── deliverables/
    └── （成果物）

```

## 🎯 次のステップ

1. 環境セットアップ（Expo、Supabase、Stripe）
2. データベース設計の詳細化
3. UIデザイン・ワイヤーフレーム作成
4. MVP開発開始

## 📝 メモ

- 作成日：2025-11-23
- 現在：企画・設計フェーズ
- 想定開発期間：7ヶ月（MVP）
- Web版リリース予定：2026年6月
- モバイルアプリリリース予定：2026年10月
- 開発体制：個人開発
- デザイン：テンプレート使用予定

---

**Last Updated**: 2025-11-23
