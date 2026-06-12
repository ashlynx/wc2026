# PITCH26 — 2026 W杯 視聴ガイド（クローン）

静的サイト（ビルド不要）。GitHub Pages 公開を想定。試合結果・順位は同一オリジンの
`wc2026-live.json` を読んで自動反映する（無い場合は `data.js` の静的データにフォールバック）。

## ファイル
- `index.html` / `schedule.html` / `japan.html` / `standings.html` / `watch-guide.html` … 各ページ
- `styles.css` … 共有スタイル
- `data.js` … 試合・グループ・代表メンバーのデータ（静的フォールバック）
- `app.js` … 共有ロジック（ヘッダー注入・順位計算・ライブ取り込み）
- `fetch_wc2026.py` … football-data.org → `wc2026-live.json` 生成（cron用）
- `.nojekyll` / `404.html` … GitHub Pages 用

## GitHub Pages 公開
1. リポジトリ `wc2026` を作成し、このフォルダの中身を push。
2. Settings → Pages → Source = `main` / root。
3. `https://<user>.github.io/wc2026/` で公開（相対パスなのでサブパスでも動く）。

## ライブ更新（任意）
VPS で football-data.org を取得し `wc2026-live.json` を生成 → commit & push → Pages 自動再公開。

```bash
export FOOTBALL_DATA_TOKEN=xxxxx
pip install requests --break-system-packages
python3 fetch_wc2026.py            # → wc2026-live.json
```

cron 例（10分毎）:
```
*/10 * * * * cd /path/wc2026 && FOOTBALL_DATA_TOKEN=xxx python3 fetch_wc2026.py \
  && git add wc2026-live.json && git commit -m "live" && git push >/dev/null 2>&1
```

`wc2026-live.json` が無くてもサイトは動く（`data.js` の静的データを表示）。
football-data.org で World Cup (`WC`) が取得できない場合は `fetch_wc2026.py` の
`transform_*` を API-FOOTBALL 用に差し替える。

## 差し替えポイント
- アフィリエイトリンク … `app.js` の `prCard()`、`watch-guide.html` の結果ボタン（現状 `#`）
- 試合データ … `data.js`（ライブ無し時の表示）
