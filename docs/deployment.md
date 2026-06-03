# Deployment

## 本機開發

```bash
npm install
npm run dev
```

開啟終端機顯示的 localhost 網址。

## 本機打包

```bash
npm run build
```

輸出位置：

```text
dist/
```

`dist/` 已加入 `.gitignore`，不會推上 GitHub。

## CI

Workflow：

```text
.github/workflows/ci.yml
```

執行：

```bash
npm ci
npm run build
```

觸發條件：

- push 到 `main` / `master`
- pull request 到 `main` / `master`

## GitHub Pages

Workflow：

```text
.github/workflows/deploy-pages.yml
```

部署前需要在 GitHub repository 設定：

1. 前往 `Settings`
2. 前往 `Pages`
3. Source 選擇 `GitHub Actions`

推送到 `main` 或 `master` 後，workflow 會自動部署。

部署網址通常是：

```text
https://<你的帳號>.github.io/js-homework/
```

## Vite Base Path

GitHub Pages 專案頁面通常部署在 repo 子路徑，例如 `/js-homework/`。

`vite.config.js` 會依 GitHub Actions 的 `GITHUB_REPOSITORY` 自動設定 base：

```js
base: repositoryName ? `/${repositoryName}/` : '/'
```

本機開發時沒有 `GITHUB_REPOSITORY`，所以 base 會是 `/`。
