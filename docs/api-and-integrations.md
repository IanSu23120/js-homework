# API and Integrations

## Open-Meteo

用途：天氣預測。

目前使用兩個 Open-Meteo API：

- Geocoding API：依城市名稱查詢座標。
- Forecast API：依座標與旅程日期查詢每日天氣。

主要檔案：

- `src/hooks/useWeather.js`

特點：

- 不需要 API key。
- 適合學生專案與低成本部署。
- 日期過遠或 API 暫時不可用時，UI 會顯示錯誤訊息。

## OpenStreetMap

用途：地圖底圖。

透過 Leaflet TileLayer 使用：

```text
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

使用者瀏覽器需要能連線到 OpenStreetMap 圖磚服務。

## Leaflet / React Leaflet

用途：

- 顯示地圖。
- 顯示推薦景點 marker。
- 顯示行程景點 marker。
- 點選 marker 時與 UI 互動。

主要檔案：

- `src/components/TripSetupAssistant.jsx`
- `src/components/AttractionExplorer.jsx`
- `src/pages/TripDetailPage.jsx`

## GitHub Actions

Workflow：

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-pages.yml`
- `.github/workflows/docs-sync.yml`

用途：

- CI build 檢查。
- GitHub Pages 部署。
- PR 文件同步檢查。

## GitHub Pages

部署流程：

1. Push 到 `main` 或 `master`。
2. GitHub Actions 執行 build。
3. 上傳 `dist/` artifact。
4. Deploy Pages。

Vite base path 由 `vite.config.js` 依 `GITHUB_REPOSITORY` 自動設定。
