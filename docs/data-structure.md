# Data Structure

旅程資料存放於瀏覽器 `localStorage`。

## Storage Key

```text
travel-planner-trips
```

## Trip

```json
{
  "id": "trip-id",
  "name": "東京五日遊",
  "destination": "Tokyo",
  "startDate": "2026-08-12",
  "endDate": "2026-08-16",
  "coverColor": "#E85D75",
  "days": [],
  "expenses": []
}
```

## Day

```json
{
  "date": "2026-08-12",
  "items": []
}
```

## Schedule Item

```json
{
  "id": "item-id",
  "time": "09:30",
  "title": "淺草寺",
  "category": "景點",
  "note": "雷門拍照",
  "lat": 35.7148,
  "lng": 139.7967
}
```

## Normalize

`TripContext` 會在讀取資料時正規化舊資料，避免 localStorage 中缺少欄位造成頁面錯誤。

主要檔案：

- `src/context/TripContext.jsx`
- `src/hooks/useLocalStorage.js`
- `src/utils/dateUtils.js`

## 注意事項

- localStorage 是瀏覽器本機資料，不會跨裝置同步。
- 清除瀏覽器資料後，旅程資料會消失。
- 若未來加入登入或後端，需要將此資料結構轉成 API schema。
