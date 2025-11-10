# 多語言架構 (i18n)

## 系統概述

系統採用**模組化翻譯架構**，將翻譯邏輯完全分離：

- **i18nService.js**: 多頁面共用的通用翻譯服務
- **Navigation.js**: 自主管理導覽欄翻譯
- **LoginComponent.js**: 自動從 URL ?lang= 偵測語言
- **WorkExperienceService.js**: 工作經歷特定的翻譯邏輯
- **i18n/translations/*.json**: 各頁面翻譯資源

支援語言：**中文（zh-TW）、日文（ja）、英文（en）**

---

## 核心元件

### 1. LoginComponent - 自動語言偵測

從 URL 參數自動偵測語言，默認為中文。

`javascript
await LoginComponent.initialize({
  containerId: "loginScreen",
  onLogin: handleLogin
});
`

### 2. Navigation - 自主翻譯管理

自主加載導覽欄翻譯，無需外部參數。

`javascript
await Navigation.initialize({
  containerId: "navigation",
  onLanguageChange: handleLanguageChange,
  onLogout: handleLogout
});
`

### 3. i18nService - 多頁面翻譯服務

管理應用全局語言和翻譯快取。

`javascript
i18nService.initialize('zh-TW');
const translations = await i18nService.loadModuleTranslations('work-experience', 'zh-TW');
i18nService.clearCache('work-experience');
`

### 4. WorkExperienceService - 工作經歷特定邏輯

加載工作經歷翻譯。

`javascript
const translations = await WorkExperienceService.getWorkExperienceUIText('zh-TW');
WorkExperienceService.clearTranslationCache('zh-TW');
`

### 5. LanguageManager - 語言持久化

優先順序：URL 參數 > localStorage > 預設。

`javascript
LanguageManager.initialize();
const lang = LanguageManager.getLanguage();
LanguageManager.setLanguage('ja');
`

---

## 翻譯檔案結構

位置：i18n/translations/
- navigation.json - 導覽欄
- login.json - 登入表單
- work-experience.json - 工作經歷頁面

---

## 快取機制

### 雙層快取

工作經歷快取 → 全局快取 → HTTP 載入

### 快取清除時機

- 語言切換：清除該語言快取
- 開發調試：手動清除
- 頁面卸載：自動清除

---

## 使用場景

### 新增新頁面
1. 建立 HTML 檔案
2. 在 translations/ 新增翻譯
3. 初始化 LoginComponent 和 Navigation

### 新增新語言
1. 編輯各翻譯檔案
2. 更新 SUPPORTED_LANGUAGES
3. 完成

---

## 最佳實踐

✅ 推薦
- 在初始化時加載翻譯
- 使用 i18nService 管理全局語言
- 語言切換時清除快取

❌ 避免
- 在 HTML 中內嵌翻譯
- 重複加載翻譯
- 忽略快取管理

---

**版本**: 2.0
**更新**: 2025-11-10
