# AI 編碼指南 - Resume 加密履歷系統

## 專案概覽
純前端靜態網站，展示加密的個人履歷。無後端依賴，所有解密在瀏覽器完成。

**技術棧**: 原生 ES6 Modules、Web Crypto API、CSS3  
**多語言**: zh-TW (預設)、ja、en — 優先順序：URL `?lang=` > localStorage > 預設

## 核心架構（四層分層）
```
Component (UI)  →  Service (業務邏輯)  →  Repository (資料存取)  →  Middleware (認證)
                                                                      ↓
                                                              crypto-js-lib (加密核心)
```

### 關鍵設計原則
1. **全靜態方法** — 所有 Class 不使用 `new`，直接呼叫靜態方法
2. **私有字段** — 使用 `static #field` 語法
3. **統一回傳** — Service 回傳 `{ success, data, message }`
4. **翻譯快取** — Component/Service 各自快取翻譯，格式 `${module}_${language}`

## 分層規則速查

| 層級 | 檔案模式 | 職責 | 規則檔案 |
|------|----------|------|----------|
| Component | `components/*.js` | HTML建構、事件綁定、UI狀態 | `.github/instructions/ComponentRule.instructions.md` |
| Service | `services/*Service.js` | 業務邏輯、狀態管理、跨層協調 | `.github/instructions/ServiceRule.instructions.md` |
| Repository | `repositories/*Repository.js` | JSON載入、資料驗證 | `.github/instructions/RepositoryRule.instructions.md` |
| Middleware | `middleware/*.js` | 認證、Session (Cookie 30分鐘) | — |

## 關鍵程式碼位置

| 功能 | 檔案 |
|------|------|
| 登入/認證流程 | `LoginComponent.js` → `LoginService.js` → `AuthMiddleware.js` → `DecryptionService.js` |
| 語言管理 | `LanguageManager.js` (URL/localStorage)、`i18nService.js` (快取) |
| 加密/解密 | `crypto-js-lib/src/` (AES-256-CBC、PBKDF2-SHA256、100,000迭代) |
| 資料驗證 | `DataFormatValidator.js` — 自動識別加密/非加密格式 |

## 開發流程

### 啟動方式
使用 VS Code Live Server 或任何 HTTP 伺服器（需 HTTPS 或 localhost 才能使用 Web Crypto API）

### 新增頁面
1. 建立 `newpage.html`
2. 新增 `i18n/translations/newpage.json`
3. 建立對應 Service/Repository/Component
4. 在 `Navigation.js` 新增菜單項

### 重新加密資料
```bash
cd crypto-js-lib && node generate-encrypted-data.js
```

## 程式碼慣例

### 方法命名
- `initialize()` / `initializeApp()` — 初始化入口
- `handle*()` — 事件處理 (如 `handleLogin`, `handleLanguageChange`)
- `_build*HTML()` — 建構 HTML
- `_bindEvents()` — 綁定事件
- `get*()` — 取得資料/狀態
- `_validate*()` / `_sort*()` / `_format*()` — 私有輔助方法

### 日誌 Emoji
```javascript
console.log('✅ 成功');  console.error('❌ 錯誤');
console.log('🔐 認證');  console.log('🌐 語言');
```

### 回調簽名
```javascript
onLogin(password)
onLanguageChange('zh-TW' | 'ja' | 'en')
onRowClick({ type: 'parent'|'child', id, data, index })
```

## 常見問題

| 問題 | 檢查點 |
|------|--------|
| 解密失敗 | 密碼是否正確、`DecryptionService` 與 `generate-encrypted-data.js` 迭代次數是否一致 |
| 模組載入失敗 | 是否使用 HTTP 伺服器（不可用 `file://`）|
| 翻譯缺失 | `i18n/translations/*.json` 是否完整 |

---
**最後更新**: 2025-12-02 | 詳細規則請參閱 `.github/instructions/` 目錄
