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

## Suggestion

登入後的群組提案儲存在 Django 資料庫：

```json
{
  "id": 1,
  "group": "group-uuid",
  "author": {
    "id": 2,
    "username": "member"
  },
  "title": "景福宮",
  "description": "早上前往比較不熱",
  "category": "景點",
  "trip": "trip-uuid",
  "place_id": "google-place-id",
  "lat": 37.5796,
  "lng": 126.977,
  "voters": [],
  "vote_count": 0,
  "has_voted": false,
  "accepted": false,
  "accepted_schedule_item": null
}
```

提案直接隸屬共享旅程。`place_id`、`lat`、`lng` 由地圖選點自動產生，不提供手動座標欄位。創立者接受後，後端會在該旅程建立含相同位置的 `ScheduleItem`，並將其 ID 記錄在 `accepted_schedule_item`。
