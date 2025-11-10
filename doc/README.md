# 🔐 加密履歷展示系統 - 使用說明

## 📁 專案結構

```text
Resume/
├── index.html                      # 首頁（多語言支援）
├── work-experience.html            # 工作經歷頁面
├── components/                     # UI 元件層
│   ├── LoginComponent.js          # 登入表單（自動多語言偵測）
│   ├── Navigation.js              # 導覽欄（自主翻譯管理）
│   ├── WorkExperienceTable.js      # 工作經歷表格
│   ├── WorkExperienceModal.js      # 詳情對話框
│   ├── LoadingAndErrorComponent.js # 共用載入/錯誤狀態
│   └── DataFormatValidator.js      # 資料驗證
├── services/                       # 業務邏輯層
│   ├── WorkExperienceService.js    # 工作經歷業務邏輯
│   ├── LoginService.js             # 登入業務邏輯
│   ├── DecryptionService.js        # 解密服務
│   └── i18nService.js              # 多語言翻譯服務
├── repositories/                   # 資料存取層
│   ├── WorkExperienceRepository.js # 工作經歷資料
│   └── DataRepository.js           # 加密資料管理
├── middleware/                     # 中介層
│   └── AuthMiddleware.js           # 身份驗證與 Session
├── i18n/                           # 多語言系統
│   ├── LanguageManager.js          # 語言管理（URL/localStorage）
│   └── translations/               # 翻譯檔案
│       ├── navigation.json         # 導覽欄翻譯
│       ├── login.json              # 登入表單翻譯
│       └── work-experience.json    # 工作經歷翻譯
├── data/                           # 資料檔案
│   ├── resume-data.json            # 加密的履歷資料
│   └── work-experience-*.json      # 工作經歷資料（各語言）
├── styles/                         # CSS 模組
│   ├── base.css                    # 基礎樣式
│   ├── login-screen.css            # 登入畫面
│   ├── navigation.css              # 導覽欄
│   ├── work-experience.css         # 工作經歷頁面
│   └── work-experience-table.css   # 工作經歷表格
└── crypto-js-lib/                  # 加密函式庫（獨立模組）
```

## 🎯 系統架構

### 分層設計

```text
Presentation (HTML)
    ↓
Components (UI Layer)
    ├─ LoginComponent (多語言自動偵測)
    ├─ Navigation (自主翻譯管理)
    ├─ WorkExperienceTable/Modal
    └─ LoadingAndErrorComponent
    ↓
Services (Business Logic)
    ├─ WorkExperienceService
    ├─ LoginService
    ├─ DecryptionService
    └─ i18nService
    ↓
Repositories (Data Access)
    ├─ WorkExperienceRepository
    └─ DataRepository
    ↓
Middleware (Authentication)
    └─ AuthMiddleware
    ↓
crypto-js-lib (Encryption Core)
```

### 核心特色

1. **多語言支援（自動偵測）**
   - LoginComponent 從 URL `?lang=zh-TW` 自動偵測語言
   - Navigation 自主管理翻譯加載（不依賴外部參數）
   - 支援語言：中文（zh-TW）、日文（ja）、英文（en）

2. **無後端依賴**
   - 純前端加密/解密（Web Crypto API）
   - 靜態網站架構
   - 資料存儲在本地 JSON 檔案

3. **清晰的分層架構**
   - 完全分離 UI、業務邏輯、資料層
   - 易於測試和維護
   - 元件可複用於其他頁面

4. **共用狀態管理**
   - LoadingAndErrorComponent 統一管理載入/錯誤狀態
   - 減少重複代碼
   - 一致的使用者體驗

## 🔐 加密機制

### 演算法

- **對稱加密**：AES-256-CBC
- **密鑰派生**：PBKDF2-SHA256 (100,000 迭代)
- **隨機鹽**：16 bytes
- **隨機 IV**：16 bytes

### 加密資料格式

```json
{
  "version": "1.0",
  "encrypted": true,
  "algorithm": "AES-256-CBC",
  "kdf": "PBKDF2-SHA256",
  "iterations": 100000,
  "salt": "base64_encoded",
  "iv": "base64_encoded",
  "cipherText": "base64_encoded",
  "timestamp": "2025-11-10T00:00:00.000Z"
}
```

## 🚀 快速開始

### 1. 啟動開發伺服器

```bash
run GO Live
```

### 2. 開啟頁面

- **首頁**：`http://localhost:5000/` → 自動重定向至登入
- **工作經歷**：`http://localhost:5000/work-experience.html`
- **多語言**：`http://localhost:5000/?lang=ja` 或 `?lang=en`

### 3. 登入

**預設密碼**：`mySecurePassword123`

## 📝 使用說明

### 首頁 (index.html)

- 顯示個人資訊、技能、教育、工作經驗、專案、證照
- 使用 LoginComponent 自動偵測語言
- 使用 Navigation 進行導覽

### 工作經歷頁面 (work-experience.html)

- 表格顯示所有 Parent（公司）和 Child（專案）工作經歷
- 點擊「專案/項目」欄位查看詳情
- 支援語言切換

### 語言切換

```text
URL 參數方式
?lang=zh-TW  # 中文
?lang=ja     # 日文
?lang=en     # 英文

或在導覽欄直接選擇
```

### 登出

點擊導覽欄的「登出」按鈕，返回登入畫面

## 🔧 開發指南

### 新增新頁面

1. 建立 HTML 檔案（如 `portfolio.html`）
2. 在 `i18n/translations/` 新增翻譯檔案
3. 在 `Navigation.js` 更新菜單結構
4. 在新頁面初始化 LoginComponent 和 Navigation

**範例**：
```javascript
// portfolio.html
await LoginComponent.initialize({ containerId: "loginScreen", onLogin: handleLogin });
await Navigation.initialize({ 
  containerId: "navigation", 
  onLanguageChange: handleLanguageChange, 
  onLogout: handleLogout 
});
```

### 修改資料

**編輯工作經歷資料**：

```bash
編輯 data/work-experience-zh-TW.json 等檔案
頁面會自動重新加載
```

**重新加密資料**：

```bash
cd crypto-js-lib
node generate-encrypted-data.js
```

### 修改加密參數

編輯 `generate-encrypted-data.js` 和 `DecryptionService.js`：

```javascript
// 提高迭代次數（更安全但更慢）
const iterations = 200000;
```

## � 多語言系統

### 翻譯檔案結構

```json
// i18n/translations/navigation.json
{
  "zh-TW": {
    "navigation": {
      "home": "首頁",
      "workExperience": "工作經歷",
      "logout": "登出",
      ...
    }
  },
  "ja": { ... },
  "en": { ... }
}
```

### 新增語言

1. 在各翻譯檔案新增新語言
2. 在 `LanguageManager.js` 更新 `SUPPORTED_LANGUAGES`
3. 完成

## 📊 資料結構

### 工作經歷資料

**Parent（公司）**：

```json
{
  "id": "C008",
  "type": "parent",
  "period": { "start": "2025.3", "end": "2025.8", "duration": "5個月" },
  "company": { "name": "公司名", "location": "台北市" },
  "projects": [ /* Child 專案 */ ]
}
```

**Child（專案）**：

```json
{
  "id": "C008P001",
  "parentId": "C008",
  "type": "child",
  "periods": [ { "start": "2025.3", "end": "2025.8" } ],
  "name": "專案名稱",
  "role": "職務角色",
  "details": { "content": { "sections": [ ... ] } }
}
```

## 🔒 安全建議

### 生產環境

✅ 使用 HTTPS
✅ 提高迭代次數（200,000+）
✅ 使用強密碼
✅ 定期更換密碼

### 不要做

❌ 不要硬編碼密碼到代碼中
❌ 不要使用簡單密碼
❌ 不要在 URL 中傳遞密碼
❌ 不要在非 HTTPS 使用

## 🧪 測試

### 開發者工具測試

```javascript
// 開啟 F12 Console

// 測試載入資料
const data = await DataRepository.loadEncryptedData();

// 測試解密
const result = await DecryptionService.decryptData('mySecurePassword123', data);

// 測試身份驗證
const authResult = await AuthMiddleware.authenticate('mySecurePassword123', data, DecryptionService.decryptData);
```

## 🐛 常見問題

| 問題 | 解決方案 |
|------|---------|
| 頁面無法加載 | 確認使用 HTTP 伺服器而非直接開啟檔案 |
| 解密失敗 | 檢查密碼是否正確、確認迭代次數一致 |
| 模組載入失敗 | 檢查相對路徑、確保瀏覽器支援 ES6 模組 |
| 語言無法切換 | 清除快取、檢查 URL 參數是否正確 |
| 登出後無法重新登入 | 檢查 Cookie 是否被清除、Session 是否過期 |

## 📚 文檔參考

- **架構文檔**：`doc/I18N_ARCHITECTURE.md`
- **工作經歷完成報告**：`devdoc/WORK_EXPERIENCE_COMPLETION.md`
- **加密庫說明**：`crypto-js-lib/README.md`

## ✨ 核心特性總結

| 特性 | 說明 |
|------|------|
| 🔐 加密 | 純前端 AES-256-CBC 加密/解密 |
| � 多語言 | 自動偵測 + URL 參數支援 |
| 📱 響應式 | 支援桌面、平板、手機 |
| ⚡ 無後端 | 靜態網站架構，零依賴 |
| 🧩 模組化 | 清晰的分層架構，易於擴展 |
| 🎨 美觀 | 現代化設計，平滑動畫 |

---

**系統版本**：1.0
**最後更新**：2025-11-10
**支援語言**：中文、日文、英文
