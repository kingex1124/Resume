# 🤖 AI 編碼指南 - Resume 加密履歷系統

此文件為 AI 編碼代理（Copilot/Claude/Cursor）提供關鍵上下文，以便快速理解和貢獻此項目。

## 📊 專案概覽

**用途**: 前端靜態網站，展示加密的個人履歷和工作經歷

**架構**: 四層分層 (Component → Service → Repository → Middleware)

**無後端**: 純前端解密，所有資料靜態存儲在 JSON 檔案

**多語言**: 支援中文(zh-TW)、日文(ja)、英文(en)，自動偵測 + URL 參數支援

## 🏗️ 分層架構

### 層級說明

```
Presentation (HTML)
    ↓
Components (UI Layer) - components/*.js
    └─ 職責: 建立 HTML、綁定事件、狀態管理
    ├─ LoginComponent - 登入表單
    ├─ Navigation - 導覽欄
    ├─ WorkExperienceTable - 工作經歷表格
    └─ LoadingAndErrorComponent - 共用狀態
    ↓
Services (Business Logic) - services/*Service.js
    └─ 職責: 複雜業務、資料轉換、狀態管理
    ├─ DecryptionService - 資料解密
    ├─ WorkExperienceService - 工作經歷邏輯
    ├─ LoginService - 登入邏輯
    └─ i18nService - 多語言快取管理
    ↓
Repositories (Data Access) - repositories/*Repository.js
    └─ 職責: 從 JSON 檔案讀取和驗證資料
    ├─ WorkExperienceRepository - 工作經歷資料
    ├─ DataRepository - 加密資料
    └─ ProfileRepository - 個人資訊
    ↓
Middleware (Authentication) - middleware/AuthMiddleware.js
    └─ 職責: 身份驗證、Session 管理、密碼存儲
    ↓
crypto-js-lib (Encryption) - crypto-js-lib/src/
    └─ 職責: AES-256-CBC 加密/解密、PBKDF2 密鑰派生
```

### 資料流範例

```
User 登入 (LoginComponent)
    ↓
LoginService.login()
    ↓
AuthMiddleware.authenticate()
    ↓
DataRepository.loadEncryptedData()
    ↓
DecryptionService.decryptData()
    ↓
WorkExperienceService.initializeApp()
    ↓
WorkExperienceTable.initialize() (顯示資料)
```

## 🔐 核心架構特色

### 1. 加密機制

- **算法**: AES-256-CBC (對稱加密)
- **密鑰派生**: PBKDF2-SHA256, 100,000 迭代
- **加密資料格式**:
  ```json
  {
    "version": "1.0",
    "encrypted": true,
    "algorithm": "AES-256-CBC",
    "salt": "base64_encoded",
    "iv": "base64_encoded",
    "cipherText": "base64_encoded"
  }
  ```

### 2. 多語言系統

**優先順序**: URL 參數 (`?lang=ja`) > localStorage > 默認 (zh-TW)

**翻譯加載**:
- `LanguageManager` - URL/localStorage 管理
- `i18nService` - 翻譯檔案快取
- Component 自行快取翻譯避免重複載入

**支援語言**: `zh-TW`, `ja`, `en`

### 3. 無實例化設計

所有 Class 都使用**靜態方法**，無需 `new` 實例化：
```javascript
// ✅ 正確
await LoginComponent.initialize({ containerId: 'login' });
const state = WorkExperienceService.getAppState();

// ❌ 錯誤
const comp = new LoginComponent();
const service = new WorkExperienceService();
```

## 📝 開發規則

### Component 層 (components/*.js)

**規則檔案**: `.github/instructions/ComponentRule.instructions.md`

**重點**:
- 類別名稱: `*Component` 或功能名 (如 `Navigation`)
- 全靜態方法
- 私有屬性: 使用靜態私有字段語法
- 私有方法: `_methodName()`
- 標準初始化: `static async initialize(options = {})`

**方法命名約定**:
- `_buildHTML*` - 建構 HTML
- `_bindEvents` - 綁定事件
- `_format*` - 資料格式化
- `_detect*` - 偵測功能

**必要方法**:
```javascript
static async initialize(options = {}) // 初始化
static _buildHTML(data) // 建構 HTML
static _bindEvents() // 綁定事件
static show() // 顯示
static hide() // 隱藏
```

**翻譯整合**:

```javascript
// 翻譯快取
static translationCache = {};

async _loadTranslations(language) {
  const key = `module_${language}`;
  if (this.translationCache[key]) return this.translationCache[key];
  const trans = await i18nService.loadModuleTranslations('module', language);
  this.translationCache[key] = trans;
  return trans;
}
```

### Service 層 (services/*Service.js)

**規則檔案**: `.github/instructions/ServiceRule.instructions.md`

**重點**:
- 類別名稱: `*Service`
- 全靜態方法
- 私有狀態: 使用靜態私有字段語法
- 統一回傳: `{ success, data, message }`

**分類**:
1. **資料處理**: `DecryptionService` - 無狀態、純邏輯
2. **狀態管理**: `WorkExperienceService` - 維護應用狀態
3. **認證**: `LoginService` - 整合 AuthMiddleware
4. **快取**: `i18nService` - 翻譯快取管理

**方法命名**:
- `initialize*()` - 初始化
- `handle*()` - 事件處理
- `_validate*()` - 驗證
- `_process*()` - 處理
- `_sortBy*()` - 排序

**狀態管理範例**:

```javascript
// 使用靜態私有字段存儲應用狀態
static appState = { currentLanguage: 'zh-TW', data: [] };

static getAppState() {
  return { ...this.appState }; // 返回副本，避免外部直接修改
}
```

### Repository 層 (repositories/*Repository.js)

**規則檔案**: `.github/instructions/RepositoryRule.instructions.md`

**重點**:
- 類別名稱: `*Repository`
- 全靜態方法
- 職責: 從 JSON 檔案讀取和驗證資料

**方法簽名**:
```javascript
static async load*Data(language) // 載入資料
static _getDataPath(language) // 對應語言的路徑
static _validate*Data(data) // 驗證資料
static get*ById(data, id) // 查詢資料
```

**檔案路徑對應**:
```javascript
static _getDataPath(language) {
  const paths = {
    'zh-TW': './data/work-experience-zh-TW.json',
    'ja': './data/work-experience-ja.json',
    'en': './data/work-experience-en.json'
  };
  if (!(language in paths)) throw new Error(`Unsupported: ${language}`);
  return paths[language];
}
```

**資料驗證**:
```javascript
// 使用 DataFormatValidator
import { DataFormatValidator } from '../components/DataFormatValidator.js';

if (DataFormatValidator.isEncryptedDataFormat(data)) {
  return data; // 加密資料直接返回
}
DataFormatValidator.validateWorkExperienceData(data);
```

### Middleware 層 (middleware/AuthMiddleware.js)

**職責**: 身份驗證、Session 管理（使用 Cookie）

**密碼存儲**: 僅存儲密碼文字，不存儲解密結果（安全考量）

**Session 時間**: 30 分鐘

**方法**:
```javascript
static async authenticate(password, encryptedData, decryptionCallback)
static isAuthenticated()
static logout()
static getSessionStatus()
```

## 🎯 常見開發模式

### 1. 新增新頁面

1. 建立 `newpage.html`
2. 新增翻譯檔案 `i18n/translations/newpage.json`
3. 新增 Service 層邏輯
4. 初始化 LoginComponent + Navigation
5. 在 Navigation 菜單新增連結

### 2. 新增新資料項目

1. 修改 `data/work-experience-*.json` (各語言)
2. 在 Repository 中新增查詢方法
3. 在 Service 中新增處理邏輯
4. Component 調用 Service 並渲染

### 3. 語言切換流程

1. User 點擊語言按鈕 (Navigation 事件)
2. Navigation 觸發 `onLanguageChange(language)`
3. Service 收到事件: `handleLanguageChange(language)`
4. 清空翻譯快取、重新載入資料
5. 更新 Component 顯示

### 4. 密碼驗證流程

1. LoginComponent 收集密碼
2. 呼叫 `LoginService.login(password, encryptedData)`
3. LoginService 呼叫 `AuthMiddleware.authenticate()`
4. AuthMiddleware 呼叫 `DecryptionService.decryptData()`
5. 成功後設置 Cookie，失敗返回錯誤訊息

## 🔍 尋找關鍵程式碼

| 任務 | 檔案位置 |
|------|---------|
| 登入畫面 | `components/LoginComponent.js` |
| 工作經歷表格 | `components/WorkExperienceTable.js` |
| 工作經歷服務 | `services/WorkExperienceService.js` |
| 解密邏輯 | `services/DecryptionService.js` |
| 資料載入 | `repositories/DataRepository.js` |
| 身份驗證 | `middleware/AuthMiddleware.js` |
| 多語言管理 | `i18n/LanguageManager.js`, `services/i18nService.js` |
| 翻譯檔案 | `i18n/translations/*.json` |
| 工作經歷資料 | `data/work-experience-*.json` |
| 樣式文件 | `styles/base.css`, `styles/*.css` |
| Crypto 函式庫 | `crypto-js-lib/src/` |

## 📌 重要約定

### Emoji 日誌標記

```
✅ - 成功
❌ - 錯誤
🔐 - 加密/認證
📥 - 載入資料
📋 - UI/元件
🌐 - 多語言
📱 - 響應式
⚠️ - 警告
```

### 回調函數簽名

```javascript
// 表格行點擊
onRowClick({ type: 'parent'|'child', id: 'C001', data: {...}, index: 0 })

// 語言切換
onLanguageChange(language) // 'zh-TW'|'ja'|'en'

// 登出
onLogout()

// 登入
onLogin(password)
```

### 錯誤處理模式

```javascript
try {
  // 操作
} catch (error) {
  console.error('❌ 操作描述:', error.message);
  throw new Error(`失敗訊息: ${error.message}`);
}
```

## 🧪 測試和調試

### 瀏覽器 Console 測試

```javascript
// 測試解密
const data = await DataRepository.loadEncryptedData();
const result = await DecryptionService.decryptData('mySecurePassword123', data);

// 取得應用狀態
const state = WorkExperienceService.getAppState();

// 檢查認證狀態
console.log(AuthMiddleware.isAuthenticated());
```

### 常見除錯

| 問題 | 原因 | 解決 |
|------|------|------|
| 解密失敗 | 密碼錯誤或迭代次數不符 | 檢查 DecryptionService.js 和 generate-encrypted-data.js |
| 翻譯缺失 | 翻譯檔案不完整 | 檢查 i18n/translations/*.json |
| 資料載入失敗 | JSON 路徑錯誤 | 檢查 Repository._getDataPath() |
| 元件不顯示 | 容器 ID 不符 | 確認 HTML 容器 ID 和初始化參數一致 |

## 🔄 更新頻率

- **組件規則**: `.github/instructions/ComponentRule.instructions.md`
- **服務規則**: `.github/instructions/ServiceRule.instructions.md`  
- **倉庫規則**: `.github/instructions/RepositoryRule.instructions.md`

如有新的架構決策或模式，請更新相應的規則檔案。

---

**最後更新**: 2025-11-12
**版本**: 1.0
**維護者**: Resume 專案團隊
