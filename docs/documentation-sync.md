# Documentation Sync

本專案要求程式碼與文件一起維護。當功能、資料結構、API、部署流程或開發流程改變時，應同步更新 `docs/` 或 `README.md`。

## 何時需要更新文件

以下變更需要同步文件：

- 新增、移除或修改頁面路由。
- 新增或調整功能流程。
- 修改 localStorage 資料結構。
- 新增城市、景點或靜態資料格式。
- 修改 API 串接方式。
- 修改 GitHub Actions 或 GitHub Pages 部署流程。
- 新增套件或更換技術選型。
- 修改使用者操作方式。

## 建議更新對照

| 變更類型 | 建議更新文件 |
| --- | --- |
| 新功能 | `docs/features.md` |
| 技術或套件 | `docs/tech-stack.md` |
| 資料格式 | `docs/data-structure.md` |
| API 或第三方服務 | `docs/api-and-integrations.md` |
| 部署流程 | `docs/deployment.md` |
| 開發歷程 | `docs/development-process.md` |
| 未來規劃 | `docs/future-work.md` |
| 專案摘要 | `README.md` |

## GitHub Actions 檢查

Workflow：

```text
.github/workflows/docs-sync.yml
```

PR 中若修改以下路徑：

- `src/`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `index.html`
- `.github/workflows/`

就需要同時修改：

- `docs/`
- `README.md`
- `travel-planner-plan.md`

若沒有同步文件，workflow 會失敗，提醒開發者補文件。

## 例外情況

若變更真的不影響文件，例如修正 typo 或純格式調整，仍建議在 PR 說明中註明原因。若需要更細的例外規則，可後續調整 `docs-sync.yml`。
