# Development Process

本文件紀錄目前專案從企劃到可部署版本的開發過程。

## 1. 專案企劃

起點是 `travel-planner-plan.md`，定義了旅遊行程規劃 App 的方向：

- React + Vite
- localStorage 儲存
- Leaflet 地圖
- Open-Meteo 天氣
- 行程、費用、匯出等後續功能

## 2. 建立 Vite React 專案

新增基本檔案：

- `package.json`
- `index.html`
- `vite.config.js`
- `src/main.jsx`
- `src/App.jsx`
- `src/styles.css`

並確認 `npm run build` 可以通過。

## 3. 首頁與旅程 CRUD

第一版功能頁包含：

- 旅程列表
- 新增旅程 modal
- 旅程卡片
- localStorage 儲存

後續將功能頁移至 `/planner`，首頁 `/` 改成介紹頁。

## 4. 城市、地圖與推薦景點

加入：

- `src/data/cities.js`
- `src/data/attractions.js`
- React Leaflet 地圖
- 推薦景點 marker
- 依目的地城市篩選推薦景點

新增旅程時可勾選推薦景點，儲存時加入第一天行程。

## 5. 天氣預測

新增 `src/hooks/useWeather.js`：

- 先用 Open-Meteo Geocoding 找城市座標。
- 再用 Forecast API 取得每日天氣。
- 顯示天氣狀態、最高溫、最低溫與降雨機率。

## 6. 旅程詳情頁

新增 `/trip/:tripId`：

- 日期切換
- 新增行程項目
- 編輯時間、標題、類別、備註
- 刪除行程
- 地圖 marker 與行程同步聚焦
- 複製行程摘要

## 7. GitHub 準備

補上：

- README
- `.gitignore`
- GitHub Actions CI
- GitHub Pages deploy workflow

## 8. 文件化與同步機制

新增 `docs/` 文件集，並加入 Documentation Sync workflow。未來修改程式碼、設定或 workflows 時，PR 需同步更新 `docs/` 或 `README.md`。
