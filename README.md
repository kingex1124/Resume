# 🔐 加密履歷展示系統

## 📋 快速概覽

| 特性 | 說明 |
|------|------|
| 🔐 **加密** | 純前端 AES-256-CBC，無後端依賴 |
| 🌐 **多語言** | 自動偵測 + URL 參數，支持中日英 |
| 📱 **響應式** | 桌面、平板、手機完美適配 |
| ⚡ **靜態** | 零外部依賴，可直接部署到任何靜態主機 |
| 🧩 **模組化** | 清晰的四層分層架構，易於擴展 |
| 🎨 **美觀** | 現代化設計，平滑動畫效果 |

## 📁 核心目錄結構

```text
Resume/
├── .github/
│   ├── copilot-instructions.md        # AI 編碼代理指南
│   └── instructions/                  # 分層設計規則
│
├── components/                        # UI 展示層
│   ├── LoginComponent.js              # 登入表單
│   ├── Navigation.js                  # 導覽欄
│   └── WorkExperienceTable.js         # 工作經歷表格
│
├── services/                          # 業務邏輯層
│   ├── DecryptionService.js           # 資料解密
│   ├── WorkExperienceService.js       # 工作經歷邏輯
│   └── i18nService.js                 # 多語言快取
│
├── repositories/                      # 資料存取層
│   ├── DataRepository.js              # 加密資料
│   └── WorkExperienceRepository.js    # 工作經歷資料
│
├── middleware/
│   └── AuthMiddleware.js              # 身份驗證
│
├── i18n/
│   ├── LanguageManager.js             # 語言管理
│   └── translations/                  # 翻譯檔案
│
├── data/                              # 靜態資料
│   ├── resume-data.json               # 加密的履歷資料
│   └── work-experience-*.json         # 工作經歷（各語言）
│
├── styles/                            # CSS 樣式
│   ├── base.css                       # 基礎樣式
│   └── *.css                          # 模組樣式
│
└── crypto-js-lib/                     # 加密函式庫
    ├── src/                           # AES、PBKDF2 實現
    └── generate-encrypted-data.js     # 資料加密工具
```

## 🎯 系統架構

### 分層設計

```text
┌─────────────────────────────────┐
│  Presentation (HTML)            │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Component Layer (UI展示)        │
│  LoginComponent, Navigation等   │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Service Layer (業務邏輯)        │
│  解密、狀態管理、翻譯快取       │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Repository Layer (資料存取)    │
│  JSON 讀取、驗證                │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Middleware (認證)              │
│  AuthMiddleware                 │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Crypto (加密核心)              │
│  AES-256-CBC、PBKDF2           │
└─────────────────────────────────┘
```

### 核心特色

#### 1. 多語言系統（自動偵測）

- URL 參數優先：`?lang=ja` → 中文(zh-TW) → 日文(ja) → 英文(en)
- LoginComponent 自動從 URL 偵測語言
- Navigation 自主加載翻譯，不依賴外部參數

#### 2. 前端加密（無後端依賴）

- 密碼解密在瀏覽器本地進行（Web Crypto API）
- 伺服器僅存儲加密的 JSON，無法還原用戶資訊
- 支援 HTTPS-only 部署

#### 3. 清晰的分層架構

- **Component**：純 UI 展示，無業務邏輯
- **Service**：業務邏輯、狀態管理、跨層協調
- **Repository**：資料存取、驗證、格式轉換
- **Middleware**：身份驗證、Session、密碼存儲

#### 4. 靜態優先設計

- 零外部依賴（無 npm 模組）
- 直接部署到 GitHub Pages、Netlify、任何靜態主機
- 支援離線訪問（資料內嵌 JSON）

## 🔐 加密機制

### 演算法與安全性

| 參數 | 值 | 說明 |
|------|-----|------|
| **加密算法** | AES-256-CBC | 對稱加密 |
| **密鑰派生** | PBKDF2-SHA256 | 密碼基於密鑰派生 |
| **迭代次數** | 100,000 | 防止暴力破解 |
| **隨機鹽** | 16 bytes | 每次生成不同的鹽 |
| **初始向量** | 16 bytes | 每次生成不同的 IV |

### 加密資料格式

```json
{
  "version": "1.0",
  "encrypted": true,
  "algorithm": "AES-256-CBC",
  "kdf": "PBKDF2-SHA256",
  "iterations": 100000,
  "salt": "X3K7+4lZmQ0Yj2kP5wR9sT=",
  "iv": "A1b2C3d4E5f6G7h8I9j0K1l=",
  "cipherText": "aBcDeFgHiJkLmNoPqRsT...",
  "timestamp": "2025-11-12T10:30:45.000Z"
}
```

## 🚀 快速開始

### 安裝與啟動

**使用 VS Code Live Server**：

1. 在 VS Code 中右鍵點擊 `index.html`
2. 選擇「Open with Live Server」
3. 瀏覽器自動打開 `http://localhost:5500/`

**使用其他 HTTP 伺服器**：

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx http-server
```

### 訪問頁面

| 頁面 | URL | 說明 |
|------|-----|------|
| **首頁** | `http://localhost:5500/` | 個人資訊展示 |
| **工作經歷** | `http://localhost:5500/work-experience.html` | 工作項目詳情 |
| **履歷** | `http://localhost:5500/resume.html` | 完整履歷 |
| **中文版** | `?lang=zh-TW` | 預設語言 |
| **日文版** | `?lang=ja` | 日文版本 |
| **英文版** | `?lang=en` | 英文版本 |

### 登入憑證

```text
預設密碼：mySecurePassword123
Session 超時：30 分鐘
```

### 首次使用

1. 瀏覽器打開首頁 → 自動跳轉至登入畫面
2. 輸入密碼 `mySecurePassword123`
3. 點擊「登入」或按 Enter
4. 成功後自動跳轉至首頁
5. 點擊導覽欄語言按鈕可切換語言

## 📝 頁面說明

### 首頁 (index.html)

**展示內容**：個人資訊、技能、教育背景、工作經歷摘要、專案案例、證照

**支援功能**：

- ✅ 語言自動偵測（URL 參數優先）
- ✅ 返回頂部按鈕（scroll 時自動顯示）
- ✅ 導覽欄語言切換
- ✅ 登出功能（返回登入畫面）
- ✅ 響應式設計（桌面、平板、手機）

### 工作經歷頁面 (work-experience.html)

**功能**：表格展示所有工作項目，支持階層展開、詳情查看

**互動功能**：

- 點擊公司行 → 展開/收起專案列表
- 點擊「專案名稱」欄 → 打開詳情對話框
- 語言切換 → 重新加載該語言的資料
- 表格排序 → 按開始日期排序

### 履歷頁面 (resume.html)

**包含內容**：個人簡介、技能清單、教育背景、工作經歷、專案案例、證照與認證

## 🔧 開發工作流程

### 新增新頁面

**步驟**：

1. 建立新 HTML 檔案（如 `portfolio.html`）
2. 在 `i18n/translations/` 新增翻譯檔案（如 `portfolio.json`）
3. 在 `services/` 新增 Service 層邏輯
4. 在 `repositories/` 新增 Repository 層邏輯
5. 在 `components/` 新增 Component 層 UI
6. 在 `Navigation.js` 添加菜單項

**範例**：

```javascript
// portfolio.html
import { LoginComponent } from './components/LoginComponent.js';
import { Navigation } from './components/Navigation.js';

await LoginComponent.initialize({
  containerId: "loginScreen",
  onLogin: handleLogin
});

await Navigation.initialize({
  containerId: "navigation",
  onLanguageChange: handleLanguageChange,
  onLogout: handleLogout
});
```

### 修改資料

**編輯工作經歷**：

1. 修改 `data/work-experience-zh-TW.json` 等檔案
2. 瀏覽器自動重新加載（無需重啟伺服器）
3. 刷新頁面檢查結果

**重新加密資料**：

```bash
cd crypto-js-lib
node generate-encrypted-data.js
```

此指令會：

- 讀取 `data/` 中的所有 JSON 檔案
- 使用 AES-256-CBC 加密
- 生成 `data/resume-data.json`

### 修改加密參數

編輯 `crypto-js-lib/generate-encrypted-data.js`：

```javascript
// 調整安全強度
const ITERATIONS = 100000; // ← 修改此值
// 建議值：開發(50000)、生產(200000+)
```

### 新增語言支援

1. 在 `i18n/LanguageManager.js` 的 `SUPPORTED_LANGUAGES` 中添加新語言碼
2. 編輯所有 `i18n/translations/*.json` 檔案，添加新語言翻譯
3. 在資料 JSON 中添加新語言資料（如 `work-experience-ko.json`）

## 📚 檔案對應關係速查表

| 功能 | 檔案位置 | 職責 |
|------|--------|------|
| 登入畫面 | `components/LoginComponent.js` | UI 展示 + 語言偵測 |
| 導覽欄 | `components/Navigation.js` | 導覽 + 語言切換 |
| 工作經歷表格 | `components/WorkExperienceTable.js` | 表格展示 + 事件 |
| 詳情對話框 | `components/WorkExperienceModal.js` | 模態框管理 |
| 工作經歷邏輯 | `services/WorkExperienceService.js` | 狀態管理 |
| 履歷邏輯 | `services/ResumeService.js` | 履歷狀態管理 |
| 解密服務 | `services/DecryptionService.js` | AES 解密 |
| 多語言管理 | `services/i18nService.js` | 翻譯快取 |
| 資料讀取 | `repositories/DataRepository.js` | 加密資料 |
| 工作經歷資料 | `repositories/WorkExperienceRepository.js` | 工作數據 |
| 身份驗證 | `middleware/AuthMiddleware.js` | 密碼驗證 + Session |
| 語言管理 | `i18n/LanguageManager.js` | URL 與 localStorage |
| 加密庫 | `crypto-js-lib/src/` | AES、PBKDF2、RSA |

## 🔒 安全建議

### 生產環境部署

✅ 使用 HTTPS
✅ 提高迭代次數（200,000+）
✅ 使用強密碼（至少 16 字符）
✅ 定期更換密碼
✅ 監控訪問日誌

### 不要做

❌ 不要硬編碼密碼到代碼中
❌ 不要使用簡單密碼（< 8 字符）
❌ 不要在 URL 中傳遞密碼
❌ 不要在非 HTTPS 使用
❌ 不要將私有資訊存儲在前端

## 🧪 測試與除錯

### 瀏覽器 Console 測試

```javascript
// 測試載入資料
const data = await DataRepository.loadEncryptedData();

// 測試解密
const result = await DecryptionService.decryptData(
  'mySecurePassword123',
  data
);

// 取得應用狀態
const state = WorkExperienceService.getAppState();

// 檢查認證狀態
console.log(AuthMiddleware.isAuthenticated());
```

### 常見問題排解

| 問題 | 原因 | 解決方案 |
|------|------|--------|
| 頁面無法加載 | 使用 file:// 協議 | 使用 HTTP 伺服器 |
| 解密失敗 | 密碼錯誤或迭代次數不符 | 檢查密碼和迭代次數 |
| 模組載入失敗 | 相對路徑錯誤 | 檢查路徑和 ES6 模組支持 |
| 語言無法切換 | 翻譯檔案不完整 | 檢查 `i18n/translations/*.json` |
| 登出後無法重新登入 | Cookie 或 Session 問題 | 清除瀏覽器資料 |

## 📚 文檔參考

- **AI 編碼指南**：`.github/copilot-instructions.md`
- **組件設計規則**：`.github/instructions/ComponentRule.instructions.md`
- **服務設計規則**：`.github/instructions/ServiceRule.instructions.md`
- **倉庫設計規則**：`.github/instructions/RepositoryRule.instructions.md`
- **架構文檔**：`doc/I18N_ARCHITECTURE.md`
- **加密庫說明**：`crypto-js-lib/README.md`

## ✨ 項目特性總結

| 特性 | 描述 |
|------|------|
| 🔐 **加密** | AES-256-CBC + PBKDF2-SHA256，密碼在本地驗證 |
| 🌐 **多語言** | 自動偵測 + URL 參數支持，中日英完整翻譯 |
| 📱 **響應式** | 桌面 + 平板 + 手機，完美適配所有屏幕 |
| ⚡ **無依賴** | 零 npm 模組，純原生 JavaScript，可離線使用 |
| 🧩 **模組化** | 清晰的四層分層，易於擴展和維護 |
| 🎨 **美觀** | 現代化設計，平滑動畫，極佳用戶體驗 |
| 📚 **文檔** | 詳細的架構說明和開發指南 |
| 🚀 **部署簡單** | 一鍵部署到任何靜態主機 |

## 📞 常見問題

**Q：資料存儲在哪裡？**

A：加密後存儲在 `data/resume-data.json`，靜態 JSON 檔案。

**Q：密碼可以修改嗎？**

A：可以。編輯 `crypto-js-lib/generate-encrypted-data.js`，執行加密命令重新生成。

**Q：支持多個用戶嗎？**

A：目前單密碼認證。可在 AuthMiddleware 中添加多用戶邏輯。

**Q：可以自訂樣式嗎？**

A：可以。修改 `styles/` 中的 CSS 檔案即可。

**Q：可以添加新功能嗎？**

A：完全可以。遵循 `.github/instructions/` 中的規則即可。

---

**系統版本**：1.0
**最後更新**：2025-11-12
**支援語言**：中文、日文、英文
**許可證**：MIT
