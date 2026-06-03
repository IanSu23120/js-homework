# Project Overview

Travel Planner 是一個以 React + Vite 製作的旅遊行程規劃工具。專案目標是讓使用者從目的地城市出發，建立旅程、查看推薦景點、加入每日行程，並透過地圖與天氣資訊輔助規劃。

## 使用情境

- 使用者想快速建立一趟旅程。
- 使用者想依城市查看推薦景點。
- 使用者想把景點加入每日行程。
- 使用者想在地圖上確認景點位置。
- 使用者想複製行程摘要貼到 LINE、Notion 或其他筆記工具。

## 目前狀態

專案已完成介紹首頁與功能頁分離：

- `/`：產品介紹首頁
- `/planner`：旅程管理與地圖探索
- `/trip/:tripId`：旅程詳情與每日行程編輯

目前不需要後端。旅程資料儲存在瀏覽器 `localStorage`。

## 核心特色

- Local-first：資料存在本機瀏覽器。
- Map-first：推薦景點與行程都能對應地圖位置。
- API-light：天氣使用 Open-Meteo，不需 API key。
- 可部署：支援 GitHub Actions CI 與 GitHub Pages。
