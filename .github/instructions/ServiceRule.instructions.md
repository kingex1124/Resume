---
applyTo: 'services\*Service.js'
---

# Service 設計規則

## 職責
Service 處理業務邏輯、資料轉換、狀態管理和層級協調。全為靜態方法，無實例化。

## 核心規則

### 1. 基本結構
- **命名**: `*Service` (如 `WorkExperienceService`)
- **私有屬性**: `static #appState`, `static #cache` (使用 `#` 語法)
- **日誌**: 使用 Emoji (✅ 成功, ❌ 錯誤, 🔐 認證, 🌐 語言)

### 2. 服務類型

| 類型 | 例子 | 職責 |
|------|------|------|
| **資料處理** | DecryptionService | 純邏輯、無狀態、返回 `{success, data, message}` |
| **狀態管理** | WorkExperienceService | 管理 `#appState`，協調 Repository/Component |
| **認證** | LoginService | 防重入、整合 Middleware |
| **快取** | i18nService | 快取鍵格式: `${module}_${language}` |

### 3. 方法命名約定

| 前綴 | 用途 | 例子 |
|------|------|------|
| `static` | 初始化 | `initializeApp()`, `initialize()` |
| `get*` | 取得資料 | `getAppState()`, `getProfile()` |
| `handle*` | 事件處理 | `handleLogin()`, `handleLanguageChange()` |
| `_validate*` | 驗證 | `_validateParams()`, `isValidId()` |
| `_sort*` | 排序 | `_sortByPeriodStart()` |
| `_*To*` | 轉換 | `_base64ToUint8Array()` |

### 4. 初始化模式

```javascript
// 單次初始化（防止重複）
static #initialized = false;
static initialize(config) {
  if (this.#initialized) return;
  this.#initialized = true;
}

// 可重複初始化（狀態刷新）
static async initializeApp(language) {
  const data = await Repository.loadData(language);
  this.#appState = { language, data };
  return this.#appState;
}
```

### 5. 統一回傳格式
- **資料處理**: `{ success: boolean, data: any, message: string }`
- **狀態查詢**: 返回狀態副本 `{ ...this.#appState }`
- **驗證**: 返回布林值 `true/false`

### 6. 狀態管理

```javascript
static #appState = { currentLanguage: 'zh-TW', data: null };

static getAppState() {
  return { ...this.#appState }; // 返回副本，避免外部修改
}
```

### 7. 錯誤處理

```javascript
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  console.error('❌ 操作:', error);
  return { success: false, message: error.message };
}
```

### 8. 快取管理

```javascript
static #cache = {};

static async loadWithCache(key, loaderFn) {
  if (this.#cache[key]) return this.#cache[key];
  const data = await loaderFn();
  this.#cache[key] = data;
  return data;
}

static clearCache(key = null) {
  if (key) delete this.#cache[key];
  else this.#cache = {};
}
```

### 9. 代碼組織結構 (Code Organization with #region)

所有 Service 必須按順序使用 `//#region` 組織：

#### 強制順序
1. **變數宣告** - 靜態私有字段 (`#translationCache`, `#appState`, `#encryptedData`)
2. **初始化與建構式** - `initializeApp()`, `initialize()`
3. **使用方法** - `getAppState()`, `get*()`, `is*()`, `prepare*()` 等公開方法
4. **UI 相關方法** - `_initializeUI()`, `_renderPage()`, 翻譯加載與清除
5. **事件處理方法** - `handleLogin()`, `handleLanguageChange()`, `handleLogout()`, `autoOpen*()`
6. **共用方法** - 共享的私有方法 (`_decrypt*()`, `_updateAppState()`, `tryRestoreSession()`)
7. **私有方法** - 輔助方法 (`_sortBy*()`, `_parse*()`, `_get*()`, `_validate*()`)

#### 快速參考

```javascript
export class WorkExperienceService {
  //#region 變數宣告
  static #translationCache = {};
  static #appState = { currentLanguage: 'zh-TW', sortedRows: [] };
  static #encryptedData = null;
  //#endregion

  //#region 初始化與建構式
  static async initializeApp(language = 'zh-TW') { /* ... */ }
  //#endregion

  //#region 使用方法
  static getAppState() { return { ...this.#appState }; }
  static isParentId(id) { return /^C\d{3}$/.test(id); }
  //#endregion

  //#region UI 相關方法
  static async _initializeUI(parentExps) { /* ... */ }
  static async getWorkExperienceUIText(language) { /* ... */ }
  //#endregion

  //#region 事件處理方法
  static async handleLogin(password) { /* ... */ }
  static async handleLanguageChange(language) { /* ... */ }
  //#endregion

  //#region 共用方法
  static async _decryptSingleData(decryptFn, password = null) { /* ... */ }
  static _updateAppStateWithDecryptedData(parentExps) { /* ... */ }
  //#endregion

  //#region 私有方法
  static _sortByPeriodStart(experiences) { /* ... */ }
  static _parsePeriodDate(dateStr) { /* ... */ }
  //#endregion
}
```

#### 重要提示
- ✅ 必須按順序使用 region（順序固定）
- ✅ 私有方法（`_` 前綴）一律放在「私有方法」region
- ✅ 事件處理（`handle` 或 `autoOpen`）一律放在「事件處理方法」region
- ❌ 不要打亂 region 順序或跨 region 放置方法

## 實際範例

參考 WorkExperienceService.js 和 ResumeService.js 的實現模式。

