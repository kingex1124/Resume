# 瀏覽器使用指南

## 環境需求

### 必須條件
1. **HTTPS 或 localhost 環境**
   - Web Crypto API 只能在安全環境下運行
   - 開發時使用 `http://localhost` 或 `http://127.0.0.1`
   - 生產環境必須使用 HTTPS

2. **現代瀏覽器支援**
   - Chrome 60+
   - Firefox 57+
   - Safari 11+
   - Edge 79+

## 可用的示範頁面

### 1. test-simple.html - 簡單測試頁面
**用途**: 快速測試基本功能是否正常
**測試項目**:
- AES 加密/解密
- RSA 加密/解密
- SHA-256 哈希
- PBKDF2 密鑰派生

**使用方式**:
```
http://localhost:8000/test-simple.html
```

### 2. demo.html - CryptoExtension 範例
**用途**: 展示類似 C# Extension Methods 的使用方式
**功能**:
- 基本 AES 加密 (固定 IV)
- 隨機 IV 加密 (推薦)
- 自訂 IV 加密

**使用方式**:
```
http://localhost:8000/demo.html
```

### 3. example.html - 完整功能展示
**用途**: 展示所有加密功能的完整使用
**功能**:
- AES 對稱加密
- RSA 非對稱加密
- SHA-256/SHA-512 哈希
- PBKDF2/Argon2 密鑰派生
- 完整的密碼加密系統

**使用方式**:
```
http://localhost:8000/example.html
```

## 常見問題

### Q1: 頁面顯示 "Web Crypto API 不可用"
**原因**: 沒有在 HTTPS 或 localhost 環境下運行
**解決**: 使用 `http://localhost:8000` 而不是 `http://<IP地址>:8000`

### Q2: 模組載入失敗 (404 錯誤)
**原因**: 沒有正確安裝依賴或路徑錯誤
**解決**:
```bash
npm install
```

### Q3: Argon2 載入很慢或失敗
**原因**: Argon2 需要從 CDN 載入 WebAssembly
**解決**: 
- 使用 PBKDF2 作為替代方案（更快）
- 確保網路連線正常
- 等待 hash-wasm CDN 載入完成

### Q4: 在 Firefox 中出現 CORS 錯誤
**原因**: Firefox 對 file:// 協議有更嚴格的限制
**解決**: 必須使用 HTTP 伺服器，不能直接開啟 HTML 檔案

## 效能建議

### 密鑰派生
- **開發/測試**: 使用 PBKDF2，迭代次數 10,000
- **生產環境**: 
  - PBKDF2: 100,000 - 600,000 次迭代
  - Argon2id: 記憶體 64MB, 迭代 3-5 次

### AES 加密
- 永遠使用隨機 IV (`encryptAesByRandomIV`)
- 不要在生產環境使用固定 IV

### RSA 加密
- 密鑰長度建議 2048 或 4096 位元
- 只加密小量資料（如 AES 密鑰）
- 大量資料應使用 AES + RSA 混合加密

## 安全注意事項

1. **永遠不要硬編碼密鑰**
   - 使用環境變數或安全的密鑰管理系統

2. **密碼處理**
   - 使用強密碼
   - 加鹽派生密鑰
   - 使用足夠的迭代次數

3. **IV (初始化向量)**
   - 每次加密使用新的隨機 IV
   - IV 可以公開，但不可重複使用

4. **資料傳輸**
   - 必須使用 HTTPS
   - 不要在 URL 中傳遞機密資訊

## 除錯技巧

### 開啟瀏覽器開發者工具
- Chrome/Edge: `F12` 或 `Ctrl+Shift+I`
- Firefox: `F12` 或 `Ctrl+Shift+K`
- Safari: `Cmd+Option+I`

### 查看錯誤訊息
```javascript
// 所有錯誤都會記錄到 console
// 在開發者工具的 Console 標籤中查看
```

### 測試連接
```javascript
// 在 Console 中執行
console.log('Crypto API:', !!window.crypto.subtle);
console.log('TextEncoder:', !!window.TextEncoder);
console.log('Location:', window.location.protocol);
```

## 程式碼範例

### 基本使用
```javascript
import { CryptoInitializer, Pbkdf2Strategy } from './src/index.js';

// AES 加密
await CryptoInitializer.initAesSetting('myKey');
const ctx = CryptoInitializer.getAesContextForEncryptByRandomIV();
const result = await ctx.encryptWithIVToBase64('Hello');

// 解密
const decCtx = CryptoInitializer.getAesContextForDecryptByRandomIV(result.iv);
const plain = await decCtx.decryptFromBase64(result.cipherText);
```

### 使用 CryptoExtension
```javascript
import { encryptAesByRandomIV, decryptAesByRandomIV } from './src/CryptoExtension.js';

// 加密
const { cipher, iv } = await encryptAesByRandomIV('Secret');

// 解密
const plain = await decryptAesByRandomIV(cipher, iv);
```

## 支援

如遇到問題，請：
1. 檢查瀏覽器控制台錯誤訊息
2. 確認環境符合需求
3. 查看 README.md 和 QUICKSTART.md
4. 檢查 package.json 中的依賴版本
