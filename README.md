# Travel Planner

以 React + Vite 與 Django REST Framework 製作的旅遊行程規劃工具。使用者可以建立旅程、選擇目的地城市、查看推薦景點與天氣預測，並與群組成員共同規劃。

## 功能

- 介紹首頁與功能頁分離
- 建立旅程：名稱、目的地城市、出發日期、回程日期、封面顏色
- 支援多個亞洲旅遊城市：日本、韓國、台灣、泰國、越南、新加坡、港澳、馬來西亞、印尼、上海
- 新增旅程時顯示城市地圖與推薦景點
- 可將推薦景點加入第一天行程
- 使用 Open-Meteo 顯示每日天氣預測
- 旅程列表與統計摘要
- 旅程詳情頁可編輯每日行程
- 行程地圖標記與行程項目同步聚焦
- 一鍵複製行程摘要
- 獨立提案頁整合地圖選點、景點推薦、群組投票與採納排行程
- 登入後的旅程、群組與協作資料儲存在 Django 資料庫

## 頁面

| 路由 | 說明 |
| --- | --- |
| `/` | 介紹首頁 |
| `/planner` | 功能頁：旅程列表、新增旅程、地圖探索 |
| `/trip/:tripId` | 旅程詳情頁：每日行程與地圖 |
| `/trip/:tripId/expenses` | 旅程費用總覽 |
| `/trip/:tripId/suggestions` | 地圖提案、群組投票與採納 |

## 技術

- React
- Vite
- React Router
- React Leaflet + Leaflet
- OpenStreetMap
- Open-Meteo API
- localStorage

## 安裝與執行

```bash
npm install
npm run dev
```

開發伺服器啟動後，打開終端機顯示的 localhost 網址。

## 打包

```bash
npm run build
```

打包輸出會產生在 `dist/`，此資料夾已加入 `.gitignore`，不會推到 GitHub。

## GitHub Actions

專案已加入基本 CI workflow 與 GitHub Pages 部署 workflow：

```text
.github/workflows/ci.yml
.github/workflows/deploy-pages.yml
```

每次 push 或 pull request 到 `main` / `master` 時，GitHub Actions 會自動執行：

```bash
npm ci
npm run build
```

用來確認依賴安裝與正式打包都正常。

部署到 GitHub Pages 時，`deploy-pages.yml` 會在 push 到 `main` / `master` 後自動 build 並發布 `dist/`。

GitHub repository 需要到 `Settings → Pages`，將 Source 設為 `GitHub Actions`。部署完成後網址通常會是：

```text
https://<你的帳號>.github.io/js-homework/
```

## API 說明

目前天氣使用 Open-Meteo：

- 不需要 API key
- 透過目的地城市查詢座標
- 依旅程日期抓每日天氣、溫度與降雨機率

地圖使用 OpenStreetMap 圖磚與 Leaflet。瀏覽器需要能連網才會看到地圖底圖與天氣資料。

## 專案結構

```text
src/
├── components/
├── context/
├── data/
├── hooks/
├── pages/
├── utils/
├── App.jsx
├── main.jsx
└── styles.css
```

## 文件

詳細文件放在 `docs/`：

- `docs/project-overview.md`
- `docs/tech-stack.md`
- `docs/development-process.md`
- `docs/features.md`
- `docs/data-structure.md`
- `docs/api-and-integrations.md`
- `docs/deployment.md`
- `docs/future-work.md`
- `docs/documentation-sync.md`

未來若修改功能、資料結構、API、部署流程或技術選型，請同步更新文件。PR 會透過 `.github/workflows/docs-sync.yml` 檢查程式碼變更是否有同步文件。

## 注意事項

- `node_modules/`、`dist/`、`.env*` 都已加入 `.gitignore`
- 若瀏覽器顯示舊資料，可清除 `localStorage` 的 `travel-planner-trips`
- 此專案目前沒有後端，換瀏覽器或清除資料後，已建立的旅程不會保留
