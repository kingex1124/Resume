---
applyTo: 'repositories\*Repository.js'
---

# Repository 設計規則

## 職責
Repository 是**資料存取層**，負責從 JSON 檔案讀取和驗證特定領域的資料。

## 核心規則

### 1. 類別結構
- **命名**: `*Repository` (如 `WorkExperienceRepository`)
- **方法**: 全為靜態方法（無實例化）
- **日誌**: 使用 Emoji 標記 (✅ 成功, ❌ 錯誤, 📥 載入)

### 2. 主要方法簽名

| 方法 | 職責 | 回傳值 |
|------|------|--------|
| `load*Data(language)` | 根據語言載入 JSON 檔案 | Promise<Object> |
| `_getDataPath(language)` | 對應語言的檔案路徑 | string |
| `_validate*Data(data)` | 驗證資料格式與必要欄位 | void (throw error) |
| `get*(data, id)` | 查詢特定資料項目 | Object\|Array\|null |

### 3. 檔案路徑對應
```javascript
static _getDataPath(language) {
  const paths = {
    'zh-TW': './data/work-experience-zh-TW.json',
    'ja': './data/work-experience-ja.json',
    'en': './data/work-experience-en.json'
  };
  // 不支援語言拋出錯誤
  if (!(language in paths)) throw new Error(`Unsupported language: ${language}`);
  return paths[language];
}
```

### 4. 驗證邏輯
使用 `DataFormatValidator` 進行統一驗證（支援加密/非加密資料）：
```javascript
import { DataFormatValidator } from '../components/DataFormatValidator.js';

// 在 load 方法中
if (DataFormatValidator.isEncryptedDataFormat(data)) {
  console.log('🔐 偵測到加密資料格式，直接返回');
  return data;
}

// 非加密資料驗證
DataFormatValidator.validateWorkExperienceData(data);
```

### 5. 錯誤處理模式
```javascript
try {
  const response = await fetch(dataPath);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  
  // 驗證資料格式
  DataFormatValidator.validate*(data);
  
  console.log('✅ 資料載入成功');
  return data;
} catch (error) {
  console.error('❌ 載入失敗:', error.message);
  throw new Error(`Failed to load data: ${error.message}`);
}
```

### 6. 私有方法命名
- 以 `_` 開頭 (如 `_getDataPath`, `_validateWorkExperienceData`)

### 7. 輔助查詢方法
實作資料過濾/查詢方法：
- `getParent*(data)` - 篩選 type='parent' 項目
- `get*ById(data, id)` - 根據 ID 查詢
- `get*Metadata(data)` - 提取中繼資訊 (version, count 等)

