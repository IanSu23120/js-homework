# Tech Stack

## Frontend

- React：主要 UI 框架。
- Vite：開發伺服器與正式打包工具。
- React Router：處理 `/`、`/planner`、`/trip/:tripId` 路由。

## 地圖

- Leaflet：地圖核心 library。
- React Leaflet：React 元件化地圖整合。
- OpenStreetMap：地圖圖磚來源。

## 天氣

- Open-Meteo：免 API key 的天氣服務。
- Geocoding API：依城市名稱取得經緯度。
- Forecast API：依旅程日期取得每日天氣、溫度、降雨機率。

## 狀態與資料

- React Context：集中管理旅程資料。
- Custom Hook `useLocalStorage`：讀寫瀏覽器 localStorage。
- 靜態資料檔：城市與推薦景點存放於 `src/data/`。

## CI / Deploy

- GitHub Actions CI：執行 `npm ci` 與 `npm run build`。
- GitHub Pages workflow：build 後發布 `dist/`。
- Documentation Sync workflow：PR 中程式碼變更時檢查是否同步文件。

## 重要檔案

- `src/App.jsx`：路由入口。
- `src/pages/`：頁面元件。
- `src/components/`：共用 UI 與功能元件。
- `src/context/TripContext.jsx`：旅程資料與操作。
- `src/data/cities.js`：目的地城市清單。
- `src/data/attractions.js`：推薦景點清單。
- `src/hooks/useWeather.js`：Open-Meteo 天氣查詢。
- `vite.config.js`：Vite 與 GitHub Pages base path 設定。
