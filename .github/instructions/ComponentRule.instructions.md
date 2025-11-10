---
applyTo: 'components\*.js'
---

# Component 設計規則

## 職責
Component 是**展示層 (UI)**，負責 HTML 建立、事件綁定、UI 狀態管理和使用者互動。

## 核心規則

### 1. 類別結構
- **命名**: `*Component` 或功能名稱 (如 `Navigation`, `WorkExperienceTable`)
- **方法**: 全為靜態方法（無實例化）
- **私有屬性**: 使用 `#` 語法 (如 `static #translationCache = {}`)
- **日誌**: Emoji 標記 (✅ 成功, ❌ 錯誤, 📋 UI, 🌐 語言, 📱 手機版)

### 2. 標準初始化模式

```javascript
static async initialize(options = {}) {
  const { containerId, data, onEvent } = options;
  
  // 1. 驗證容器
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`❌ 找不到容器: ${containerId}`);
    return;
  }
  
  // 2. 建立 HTML
  container.innerHTML = this._buildHTML(data);
  
  // 3. 綁定事件
  this._bindEvents(onEvent);
  
  console.log('✅ 元件初始化完成');
}
```

### 3. HTML 建構模式

**階層化建構**: 主結構 → 區塊 → 單一元素

**私有方法命名**: `_build*HTML`

```javascript
static _buildHTML(data) {
  return `<div>${this._buildContentHTML(data.items)}</div>`;
}

static _buildContentHTML(items) {
  return items.map(item => this._buildItemHTML(item)).join('');
}
```

### 4. 事件綁定模式

**私有方法命名**: `_bind*Events`

```javascript
static _bindEvents(callback = null) {
  const btn = document.getElementById('action-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      this._handleAction(callback);
    });
  }
}
```

**事件委派**: 優先使用父元素事件委派（效能優化）

### 5. 元件分類

#### A. 表格型 (WorkExperienceTable)
- 列表資料顯示、行點擊、翻譯整合
- 使用 `data-*` 屬性: `data-type`, `data-id`, `data-index`
- 回調格式: `{ type, id, data, index }`

#### B. 模態框型 (WorkExperienceModal)
- 堆疊管理: `static currentStack = []`
- 階層式對話框、動態內容
- `context` 儲存額外數據（如回調函數）

#### C. 導覽型 (Navigation)
- 響應式設計: 漢堡菜單 + 桌面版
- 語言切換流程: 載入翻譯 → 更新 UI → 重新綁定事件
- 使用 `data-i18n-key` 標記可翻譯元素

#### D. 表單型 (LoginComponent)
- Enter 鍵支援、載入狀態管理
- 公開方法: `showError()`, `clearError()`, `show()`, `hide()`
- 回調函數: `onLogin`, `onCancel`

#### E. 工具型 (LoadingAndErrorComponent)
- 純靜態方法、無 `initialize()`、全域可用
- 接受 `containerId` 參數（靈活性）
- 配對方法: `show*` / `hide*`, `show*` / `clear*`

### 6. 多國語系整合

```javascript
// 翻譯載入與快取
static #translationCache = {};
static async loadTranslations(language) {
  const cacheKey = `module_${language}`;
  if (this.#translationCache[cacheKey]) return this.#translationCache[cacheKey];
  const translations = await i18nService.loadModuleTranslations('module', language);
  this.#translationCache[cacheKey] = translations;
  return translations;
}

// URL 語言偵測
static _detectLanguageFromURL() {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  return ['zh-TW', 'ja', 'en'].includes(lang) ? lang : 'zh-TW';
}
```

### 7. 資料格式化

**私有方法命名**: `_format*`

```javascript
static _formatPeriodText(period) {
  const { start, end, duration } = period;
  return `${start} ~ ${end} (${duration})`;
}
```

### 8. CSS 類別管理

```javascript
// 推薦：使用 CSS 類別
element.classList.add('hidden');
element.classList.remove('hidden');
element.classList.toggle('active');

// 強制覆蓋時使用 inline style
element.style.display = 'none !important';
```

**狀態類別**: `.active`, `.hidden`, `.disabled`, `.show`, `.clickable-text`, `.*-row`

### 9. DOM 查詢最佳實踐

```javascript
// ✅ 使用 ID 查詢
const element = document.getElementById('unique-id');

// ✅ 限定範圍查詢
const container = document.getElementById('container');
const items = container.querySelectorAll('.item');

// ✅ 快取查詢結果
const button = document.getElementById('action-btn');
if (button) {
  button.addEventListener('click', handler);
}

// ❌ 避免重複查詢
document.querySelector('.item').textContent = 'A';
document.querySelector('.item').classList.add('active');
```

### 10. 事件處理慣例

```javascript
// 阻止預設行為與冒泡
element.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

// Enter 鍵支援
inputElement.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') this.handleSubmit();
});

// 點擊外部關閉
document.addEventListener('click', (e) => {
  if (menu && !menu.contains(e.target) && !button.contains(e.target)) {
    menu.classList.remove('active');
  }
});
```

### 11. 回調函數設計

```javascript
// 統一回調格式
onRowClick({ type: 'parent', id: 'C001', data: {...}, index: 0 });
onLanguageChange(language);

// 可選回調檢查
if (this.onAction && typeof this.onAction === 'function') {
  this.onAction(data);
}
```

### 12. 公開 vs 私有方法

**公開方法**: `initialize()`, `update()`, `show()`, `hide()`, `reset()`, `clear()`, `showError()`, `clearError()`, `setLanguage()`

**私有方法**: `_buildHTML()`, `_bindEvents()`, `_formatDate()`, `_detectLanguageFromURL()`, `_validateInput()`

### 13. 錯誤處理

```javascript
static initialize(options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`❌ 找不到容器: ${containerId}`);
    return;
  }
  
  try {
    this._buildUI();
    this._bindEvents();
    console.log('✅ 初始化成功');
  } catch (error) {
    console.error('❌ 初始化失敗:', error.message);
    container.innerHTML = `<div class="error">載入失敗，請重試</div>`;
  }
}
```

### 14. 響應式設計（漢堡菜單）

```javascript
hamburgerBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  navMenu.classList.toggle('active');
});

// 點擊外部關閉
document.addEventListener('click', (e) => {
  if (navMenu.classList.contains('active')) {
    if (!navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      navMenu.classList.remove('active');
    }
  }
});
```

### 15. 效能優化

```javascript
// ✅ 事件委派
container.addEventListener('click', (e) => {
  if (e.target.matches('.item')) handler(e);
});

// ✅ 批次 DOM 操作
const html = items.map(item => createItemHTML(item)).join('');
container.innerHTML = html;
```

## Component 模板範例

```javascript
import { i18nService } from '../services/i18nService.js';

export class ExampleComponent {
  static #translationCache = {};
  static #currentLanguage = 'zh-TW';
  static onAction = null;
  
  static async initialize(options = {}) {
    const { containerId = 'example-container', data = null, onAction = null } = options;
    this.onAction = onAction;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ 找不到容器: ${containerId}`);
      return;
    }
    
    try {
      const translations = await this._loadTranslations(this.#currentLanguage);
      container.innerHTML = this._buildHTML(data, translations);
      this._bindEvents();
      console.log('✅ 元件初始化完成');
    } catch (error) {
      console.error('❌ 初始化失敗:', error.message);
    }
  }
  
  static _buildHTML(data, translations) {
    return `
      <div class="example-component">
        <h2>${translations.title}</h2>
        <button id="action-btn">${translations.actionButton}</button>
      </div>
    `;
  }
  
  static _bindEvents() {
    const actionBtn = document.getElementById('action-btn');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => this._handleAction());
    }
  }
  
  static _handleAction() {
    console.log('📋 操作被觸發');
    if (this.onAction) this.onAction();
  }
  
  static async _loadTranslations(language) {
    const cacheKey = `example_${language}`;
    if (this.#translationCache[cacheKey]) return this.#translationCache[cacheKey];
    const translations = await i18nService.loadModuleTranslations('example', language);
    this.#translationCache[cacheKey] = translations;
    return translations;
  }
  
  static update(data) { /* 更新 UI */ }
  static show() { document.getElementById('example-container')?.classList.remove('hidden'); }
  static hide() { document.getElementById('example-container')?.classList.add('hidden'); }
}
```

