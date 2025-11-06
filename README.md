# 🔐 加密履歷展示系統 - 使用說明

## 📁 專案結構

```
Resume/
├── index.html                      # 主頁面（包含登入和內容展示）
├── data/
│   └── resume-data.json           # 加密的履歷資料
├── repositories/
│   └── DataRepository.js          # 資料存取層
├── services/
│   └── DecryptionService.js       # 解密服務層
├── middleware/
│   └── AuthMiddleware.js          # 身份驗證中介層
└── crypto-js-lib/                 # 加密函式庫
    ├── src/                       # 核心加密模組
    └── generate-encrypted-data.js # 資料加密腳本
```

## 🎯 系統架構

### 分層設計

1. **Repository Layer（資料存取層）**
   - 檔案：`repositories/DataRepository.js`
   - 職責：負責從本地或遠端載入加密的 JSON 資料
   - 功能：
     - 載入加密資料檔案
     - 驗證資料格式
     - 提供加密資訊查詢

2. **Service Layer（服務層）**
   - 檔案：`services/DecryptionService.js`
   - 職責：處理資料解密的商業邏輯
   - 功能：
     - 使用 PBKDF2 從密碼派生密鑰
     - 使用 AES-256-CBC 解密資料
     - 處理解密錯誤和驗證

3. **Middleware Layer（中介層）**
   - 檔案：`middleware/AuthMiddleware.js`
   - 職責：處理身份驗證和 Session 管理
   - 功能：
     - 密碼驗證
     - Session 管理（30 分鐘自動過期）
     - 存取權限控制
     - 使用者登出

4. **Presentation Layer（展示層）**
   - 檔案：`index.html`
   - 職責：使用者介面和互動
   - 功能：
     - 登入畫面
     - 資料展示
     - 使用者操作處理

## 🔐 加密機制

### 加密演算法
- **對稱加密**：AES-256-CBC
- **密鑰派生**：PBKDF2-SHA256
- **迭代次數**：100,000 次
- **隨機鹽**：16 bytes
- **隨機 IV**：16 bytes

### 加密流程
1. 生成隨機鹽（16 bytes）
2. 使用 PBKDF2 從密碼派生 256-bit 密鑰
3. 生成隨機 IV
4. 使用 AES-256-CBC 加密 JSON 資料
5. 將密文、鹽、IV 一起存儲

### 解密流程
1. 載入加密資料（密文、鹽、IV）
2. 使用相同的密碼和鹽派生密鑰
3. 使用派生的密鑰和 IV 解密密文
4. 解析 JSON 資料

## 🚀 使用方式

### 1. 生成加密資料

```bash
cd crypto-js-lib
node generate-encrypted-data.js
```

這會生成加密的 `data/resume-data.json` 檔案。

**預設密碼**：`mySecurePassword123`

### 2. 啟動網頁伺服器

```bash
# 在 Resume 根目錄
npx http-server -p 8000

# 或使用 Python
python -m http.server 8000
```

### 3. 開啟網頁

訪問：`http://localhost:8000/`

### 4. 輸入密碼

在登入畫面輸入密碼：`mySecurePassword123`

### 5. 檢視內容

成功解密後會顯示完整的履歷內容。

## 📝 修改資料

### 方法 1：修改原始資料並重新加密

1. 編輯 `crypto-js-lib/generate-encrypted-data.js`
2. 修改 `sampleData` 物件
3. 執行：`node generate-encrypted-data.js`

### 方法 2：自訂加密腳本

```javascript
import { CryptoInitializer, Pbkdf2Strategy } from './crypto-js-lib/src/index.js';

const myData = { /* 你的資料 */ };
const password = 'yourPassword';

// 1. 生成鹽
const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);

// 2. 派生密鑰
const pbkdf2 = new Pbkdf2Strategy();
const key = await CryptoInitializer.deriveKeyFromPassword(
  password, bytesSalt, pbkdf2, 100000, 32
);

// 3. 加密
const ctx = CryptoInitializer.getAesContextForEncryptByRandomIV();
ctx.key = key;
const result = await ctx.encryptWithIVToBase64(JSON.stringify(myData));

// 4. 保存
const encrypted = {
  version: '1.0',
  encrypted: true,
  algorithm: 'AES-256-CBC',
  kdf: 'PBKDF2-SHA256',
  iterations: 100000,
  salt: base64Salt,
  iv: result.iv,
  cipherText: result.cipherText,
  timestamp: new Date().toISOString()
};
```

## 🔧 自訂配置

### 修改密碼

編輯 `crypto-js-lib/generate-encrypted-data.js`：

```javascript
const DEFAULT_PASSWORD = 'yourNewPassword';
```

### 修改 Session 過期時間

在 `index.html` 中，初始化後設定：

```javascript
AuthMiddleware.setSessionDuration(60 * 60 * 1000); // 60 分鐘
```

### 修改迭代次數

編輯 `generate-encrypted-data.js` 和 `DecryptionService.js`：

```javascript
const iterations = 200000; // 提高安全性但會更慢
```

## 🎨 自訂樣式

編輯 `index.html` 中的 `<style>` 區段，可自訂：
- 顏色配置
- 字體樣式
- 版面配置
- 動畫效果

## 🔒 安全性建議

### 生產環境
1. ✅ 使用 HTTPS
2. ✅ 提高迭代次數（200,000+）
3. ✅ 使用強密碼
4. ✅ 定期更換密碼
5. ✅ 實作密碼強度檢查
6. ✅ 添加失敗次數限制

### 不要做
1. ❌ 不要在前端程式碼中硬編碼密碼
2. ❌ 不要使用簡單的密碼
3. ❌ 不要在 URL 中傳遞密碼
4. ❌ 不要在非 HTTPS 環境使用

## 📊 資料格式

### 加密資料結構

```json
{
  "version": "1.0",
  "encrypted": true,
  "algorithm": "AES-256-CBC",
  "kdf": "PBKDF2-SHA256",
  "iterations": 100000,
  "salt": "base64_encoded_salt",
  "iv": "base64_encoded_iv",
  "cipherText": "base64_encoded_encrypted_data",
  "timestamp": "2025-11-05T12:00:00.000Z",
  "description": "描述資訊"
}
```

### 原始資料結構

```json
{
  "personal": { 個人資訊 },
  "skills": [ 技能列表 ],
  "experience": [ 工作經驗 ],
  "projects": [ 專案作品 ],
  "education": [ 教育背景 ],
  "certifications": [ 證照 ]
}
```

## 🧪 測試

### 測試解密功能

開啟瀏覽器開發者工具（F12），在 Console 中：

```javascript
// 測試載入資料
const data = await DataRepository.loadEncryptedData();
console.log(data);

// 測試解密
const result = await DecryptionService.decryptData('mySecurePassword123', data);
console.log(result);

// 測試身份驗證
const authResult = await AuthMiddleware.authenticate(
  'mySecurePassword123',
  data,
  DecryptionService.decryptData.bind(DecryptionService)
);
console.log(authResult);
```

## 🐛 常見問題

### Q1: 頁面顯示錯誤
**A**: 確認使用 HTTP 伺服器而非直接開啟檔案

### Q2: 解密失敗
**A**: 確認密碼正確，檢查 Console 錯誤訊息

### Q3: 模組載入失敗
**A**: 確認 Import Maps 設定正確，瀏覽器支援 ES6 模組

### Q4: Session 立即過期
**A**: 調整 `AuthMiddleware.setSessionDuration()` 設定

## 📈 效能優化

### 建議
1. 使用適當的迭代次數（平衡安全性和速度）
2. 啟用瀏覽器快取
3. 壓縮 JSON 資料
4. 使用 Service Worker 離線快取

## 🎉 完成！

您的加密履歷展示系統已經完成！

- ✅ 資料已加密保護
- ✅ 分層架構清晰
- ✅ 密碼驗證機制
- ✅ Session 管理
- ✅ 美觀的介面

**預設密碼**：`mySecurePassword123`

立即訪問：`http://localhost:8000/`
