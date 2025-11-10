---
applyTo: 'services\*Service.js'
---

# Service 設計規則

## 職責
Service 是**業務邏輯層**，處理複雜的業務流程、資料轉換、狀態管理和跨層協調。

## 核心規則

### 1. 類別結構
- **命名**: `*Service` (如 `WorkExperienceService`, `LoginService`)
- **方法**: 全為靜態方法（無實例化）
- **私有屬性**: 使用 `#` 語法 (如 `static #translationCache = {}`)
- **日誌**: 使用 Emoji 標記 (✅ 成功, ❌ 錯誤, 🔐 認證, 🌐 語言, 📦 快取)

### 2. 服務分類

#### A. 資料處理服務 (DecryptionService)
- 純業務邏輯、無狀態
- 統一回傳: `{ success: boolean, data: any, message: string }`

```javascript
static async decryptData(password, encryptedData) {
  try {
    this._validateDecryptionParams(password, encryptedData);
    const result = await this._performDecryption(password, encryptedData);
    return { success: true, data: result, message: '成功' };
  } catch (error) {
    return { success: false, data: null, message: error.message };
  }
}
```

#### B. 狀態管理服務 (WorkExperienceService)
- 私有狀態: `static #appState = { currentLanguage, sortedRows, translations }`
- 提供: `initializeApp()`, `getAppState()`, `refreshAppData()`
- 協調 Repository/Component

```javascript
static getAppState() {
  return { ...this.#appState }; // 返回副本
}
```

#### C. 認證服務 (LoginService)
- 防重入: `static #isAuthenticating = false`
- 整合 Middleware

```javascript
static async login(password, encryptedData) {
  if (this.#isAuthenticating) return { success: false, message: '認證進行中' };
  this.#isAuthenticating = true;
  try {
    return await AuthMiddleware.authenticate(password, encryptedData, DecryptionService.decryptData);
  } finally {
    this.#isAuthenticating = false;
  }
}
```

#### D. 快取服務 (i18nService)
- 快取物件: `static #translationCache = {}`
- 快取鍵: `${moduleName}_${language}`

```javascript
static async loadModuleTranslations(moduleName, language) {
  const cacheKey = `${moduleName}_${language}`;
  if (this.#translationCache[cacheKey]) return this.#translationCache[cacheKey];
  const data = await fetch(`./i18n/translations/${moduleName}.json`);
  const translations = await data.json();
  this.#translationCache[cacheKey] = translations[language];
  return this.#translationCache[cacheKey];
}
```

### 3. 私有方法命名
- **驗證**: `_validate*` (如 `_validateDecryptionParams`)
- **轉換**: `_*To*` (如 `_base64ToUint8Array`)
- **處理**: `_process*`, `_handle*`
- **排序**: `_sortBy*` (如 `_sortByPeriodStart`)

### 4. 初始化模式

```javascript
// 單次初始化
static #initialized = false;
static initialize(config) {
  if (this.#initialized) return;
  // 初始化邏輯
  this.#initialized = true;
}

// 可重複初始化（狀態刷新）
static async initializeApp(language) {
  this.clearCache();
  const data = await this._loadData(language);
  this.#appState = this._buildState(data);
  return this.#appState;
}
```

### 5. 事件處理方法

**命名**: `handle*`

```javascript
static async handleLanguageChange(language) {
  this.#appState.currentLanguage = language;
  this.clearTranslationCache(language);
  await this.refreshAppData(language);
  Component.update(this.#appState);
}
```

### 6. 資料驗證

```javascript
// 參數驗證（拋出錯誤）
static _validateParams(param1, param2) {
  if (!param1) throw new Error('參數 1 不能為空');
  const requiredFields = ['field1', 'field2'];
  for (const field of requiredFields) {
    if (!(field in param2)) throw new Error(`缺少必要欄位: ${field}`);
  }
}

// 業務驗證（返回布林值）
static isValidId(id) {
  return /^C\d{3}$/.test(id);
}
```

### 7. 錯誤處理

```javascript
try {
  const result = await this._performOperation();
  return { success: true, data: result, message: '成功' };
} catch (error) {
  // 判斷錯誤類型提供友善訊息
  if (error.message.includes('密碼')) {
    return { success: false, data: null, message: '密碼錯誤' };
  }
  return { success: false, data: null, message: error.message };
}
```

### 8. 整合其他層級

```javascript
// Service → Repository
static async loadData(language) {
  const rawData = await Repository.loadData(language);
  return this._processData(rawData);
}

// Service → Middleware
static async authenticate(password, data) {
  return await AuthMiddleware.authenticate(password, data, DecryptionService.decryptData.bind(DecryptionService));
}

// Service → Component
static initializeUI(data) {
  Navigation.initialize({ onLanguageChange: this.handleLanguageChange });
  Table.initialize({ data, onRowClick: this.handleRowClick });
}
```

### 9. 快取管理

**快取鍵格式**: `${moduleName}_${language}` 或 `${type}_${id}`

```javascript
static #cache = {};

static async getData(key, loaderFn) {
  if (this.#cache[key]) return this.#cache[key];
  const data = await loaderFn();
  this.#cache[key] = data;
  return data;
}

static getCacheStats() {
  return {
    count: Object.keys(this.#cache).length,
    size: `${(JSON.stringify(this.#cache).length / 1024).toFixed(2)} KB`
  };
}
```

### 10. 棄用方法

```javascript
/**
 * @deprecated 改用 newMethod()
 */
static oldMethod() {
  console.log('⚠️ oldMethod() 已棄用');
  return this.newMethod();
}
```

## Service 模板範例

```javascript
export class ExampleService {
  static #appState = { currentLanguage: 'zh-TW', data: [] };
  static #cache = {};
  
  // 初始化流程
  static async initializeApp(language) {
    try {
      const data = await Repository.loadData(language);
      if (data.encrypted) await this._handleAuthentication(data);
      const processed = this._processData(data);
      this.#appState = { language, data: processed };
      this._initializeComponents();
      return this.#appState;
    } catch (error) {
      console.error('❌ 初始化失敗:', error);
      throw error;
    }
  }
  
  // 語言切換流程
  static async handleLanguageChange(language) {
    i18nService.clearCache();
    const [data, translations] = await Promise.all([
      Repository.loadData(language),
      i18nService.loadModuleTranslations('module', language)
    ]);
    this.#appState.currentLanguage = language;
    this.#appState.translations = translations;
    Component.update(translations);
  }
  
  // 取得狀態
  static getAppState() {
    return { ...this.#appState };
  }
}
```

