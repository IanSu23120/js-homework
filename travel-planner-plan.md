# 旅遊計畫 / 行程規劃 App — 專案規劃書

## 專案簡介

以 React 開發的旅遊行程規劃工具，使用者可建立旅程、安排每日行程、查看目的地天氣與匯率，並在地圖上標記景點。

---

## 技術選型

| 類別 | 工具 / 套件 | 說明 |
|------|-------------|------|
| 框架 | React 18 + Vite | 快速開發環境 |
| 樣式 | Tailwind CSS | 快速刻 UI |
| 狀態管理 | useReducer + Context API | 管理多層旅程資料 |
| 地圖 | Leaflet.js + react-leaflet | 免費開源地圖 |
| 天氣 | Open-Meteo API | 完全免費，不需 API key |
| 匯率 | ExchangeRate-API（免費版） | 每月 1500 次，需申請免費帳號 |
| 日期處理 | date-fns | 日期格式化與計算 |
| 拖曳排序 | @dnd-kit | 行程卡片拖曳 |
| 資料儲存 | localStorage | 瀏覽器本地儲存，免費無限制 |

---

## 使用的 API 說明

### Open-Meteo（天氣）
- 網址：https://open-meteo.com
- 費用：**完全免費，無需 API key**
- 限制：無用量限制
- 提供資料：溫度、降雨機率、天氣代碼、每日預報

### ExchangeRate-API（匯率）
- 網址：https://www.exchangerate-api.com
- 費用：**免費版每月 1,500 次請求**
- 限制：需申請帳號取得免費 API key
- 提供資料：即時匯率（日圓、美元、歐元、台幣等）

### OpenStreetMap + Leaflet.js（地圖）
- 費用：**完全免費，無需 API key**
- 限制：無
- 提供資料：互動式地圖、地點標記

---

## 功能清單

### 旅程管理
- [ ] 建立旅程（名稱、目的地城市、出發/回程日期、封面顏色）
- [ ] 編輯 / 刪除旅程
- [ ] 旅程總覽卡片列表

### 每日行程
- [ ] 依日期自動產生行程天數
- [ ] 每日新增行程項目（景點名稱、時間、類別、備註）
- [ ] 拖曳排序行程項目
- [ ] 標記行程類別（交通、景點、餐廳、住宿）

### 天氣資訊
- [ ] 輸入目的地城市自動查詢座標
- [ ] 顯示旅遊日期的每日天氣預報（溫度、天氣狀況、降雨機率）
- [ ] 天氣 icon 對應顯示

### 地圖功能
- [ ] 在地圖上標記行程景點
- [ ] 點擊地圖標記顯示景點資訊
- [ ] 自動聚焦到目的地城市

### 費用管理
- [ ] 新增費用紀錄（金額、類別、日期、備註）
- [ ] 費用類別：機票、住宿、餐飲、交通、購物、門票
- [ ] 日幣 ↔ 台幣即時換算（串接 ExchangeRate-API）
- [ ] 總費用統計與類別圓餅圖

### 票價參考資料（寫死）
- [ ] 常見日本景點參考票價（東京鐵塔、淺草寺、迪士尼等）
- [ ] 顯示官網連結供使用者查詢最新票價

### 資料匯出
- [ ] 複製行程摘要文字（可貼到 Line/Notion）
- [ ] 下載行程 JSON 檔

---

## 資料結構設計

```json
{
  "trips": [
    {
      "id": "uuid",
      "name": "東京五日遊",
      "destination": "Tokyo",
      "lat": 35.6762,
      "lng": 139.6503,
      "startDate": "2025-03-01",
      "endDate": "2025-03-05",
      "coverColor": "#FF6B6B",
      "days": [
        {
          "date": "2025-03-01",
          "items": [
            {
              "id": "uuid",
              "time": "10:00",
              "title": "淺草寺",
              "category": "景點",
              "note": "雷門拍照",
              "lat": 35.7148,
              "lng": 139.7967
            }
          ]
        }
      ],
      "expenses": [
        {
          "id": "uuid",
          "amount": 50000,
          "currency": "JPY",
          "category": "機票",
          "date": "2025-03-01",
          "note": "來回機票"
        }
      ]
    }
  ]
}
```

---

## 資料夾結構

```
src/
├── components/
│   ├── TripCard.jsx          # 旅程卡片
│   ├── TripForm.jsx          # 新增/編輯旅程表單
│   ├── DaySchedule.jsx       # 單日行程列表
│   ├── ScheduleItem.jsx      # 行程項目卡片
│   ├── WeatherWidget.jsx     # 天氣預報元件
│   ├── MapView.jsx           # Leaflet 地圖
│   ├── ExpenseTracker.jsx    # 費用管理
│   ├── ExpenseChart.jsx      # 費用圓餅圖
│   └── CurrencyConverter.jsx # 匯率換算
├── context/
│   └── TripContext.jsx       # 全域狀態管理
├── hooks/
│   ├── useWeather.js         # Open-Meteo API 呼叫
│   ├── useExchangeRate.js    # 匯率 API 呼叫
│   └── useLocalStorage.js    # localStorage 讀寫
├── data/
│   └── attractions.js        # 日本景點票價參考資料
├── utils/
│   ├── dateUtils.js          # 日期格式化工具
│   └── exportUtils.js        # 匯出功能
├── App.jsx
└── main.jsx
```

---

## 頁面規劃

| 頁面 | 路由 | 說明 |
|------|------|------|
| 首頁 | `/` | 旅程列表 + 新增旅程按鈕 |
| 旅程詳情 | `/trip/:id` | 每日行程 + 天氣 + 地圖 |
| 費用管理 | `/trip/:id/expenses` | 費用清單 + 圖表 + 換算 |

---

## 開發順序建議

1. **第一階段**：建立旅程 CRUD + localStorage 儲存
2. **第二階段**：每日行程新增 / 刪除 / 拖曳排序
3. **第三階段**：串接 Open-Meteo 天氣 API
4. **第四階段**：加入 Leaflet 地圖標記
5. **第五階段**：費用管理 + ExchangeRate 匯率換算
6. **第六階段**：UI 美化 + 匯出功能

---

## 預計使用的 npm 套件

```bash
npm install react-router-dom
npm install react-leaflet leaflet
npm install date-fns
npm install @dnd-kit/core @dnd-kit/sortable
npm install recharts
npm install axios
```

---

## 注意事項

- ExchangeRate-API 的免費 API key 請存在 `.env` 檔案中（`VITE_EXCHANGE_API_KEY=xxx`），不要上傳到 GitHub
- Open-Meteo 不需要任何 key，直接呼叫即可
- Leaflet 在 Vite 環境需要額外 import CSS：`import 'leaflet/dist/leaflet.css'`
- 圖片改用封面顏色代替，避免 localStorage 5MB 限制
