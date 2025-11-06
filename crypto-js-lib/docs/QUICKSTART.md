# 快速開始指南

## 安裝依賴

```bash
cd crypto-js-lib
npm install
```

## 執行測試

```bash
# 執行所有測試
npm test

# 測試覆蓋率
npm run test:coverage
```

## 查看範例

在瀏覽器中開啟 `example.html` 檔案,即可看到所有功能的互動式範例。

**注意:** 由於使用了 ES6 模組,需要透過 HTTP 伺服器開啟,不能直接以 `file://` 協議開啟。

## 在專案中使用

### 方式一: ES6 模組導入

```javascript
import { CryptoInitializer } from './src/index.js';

// 使用 AES 加密
await CryptoInitializer.initAesSetting('myKey', 'myIV');
const aesContext = CryptoInitializer.getAesContextForEncrypt();
const result = await aesContext.encryptToBase64('Hello World');
```

### 方式二: 在 HTML 中使用

```html
<script type="module">
  import { CryptoInitializer } from './crypto-js-lib/src/index.js';
  
  async function encrypt() {
    await CryptoInitializer.initAesSetting('key', 'iv');
    const context = CryptoInitializer.getAesContextForEncrypt();
    const result = await context.encryptToBase64('test');
    console.log(result.data);
  }
  
  encrypt();
</script>
```

## 常見問題

### 1. 為什麼無法直接開啟 example.html?

因為使用了 ES6 模組,瀏覽器的安全限制需要透過 HTTP(S) 協議載入。請使用本地伺服器。

### 2. 如何在舊瀏覽器中使用?

本函式庫需要現代瀏覽器支援 Web Crypto API。如需支援舊版瀏覽器,可考慮使用 Babel 轉譯。

### 3. 測試失敗怎麼辦?

確保已安裝所有依賴:
```bash
npm install
```

如果 Argon2 測試過慢或失敗,這是正常的,因為 Argon2 計算較耗時。可以在測試中調整參數。

## 專案結構

```
crypto-js-lib/
├── src/                    # 源代碼
│   ├── aes/               # AES 加密
│   ├── rsa/               # RSA 加密
│   ├── hash/              # SHA 哈希
│   ├── kdf/               # 密鑰派生
│   ├── common/            # 共用工具
│   └── index.js           # 主入口
├── __tests__/             # 單元測試
├── example.html           # 互動式範例
├── package.json
├── jest.config.js
└── README.md
```

## 下一步

- 閱讀完整的 [README.md](./README.md)
- 在瀏覽器中嘗試 [example.html](./example.html)
- 查看 [測試檔案](./__tests__/) 了解更多用法
