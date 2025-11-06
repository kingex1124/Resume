# Crypto JS Library

完整的前端 JavaScript 加密函式庫，適用於靜態網站。提供 AES、RSA、SHA、KDF 等加密功能。

## 功能特性

- ✅ **AES 加密** - 對稱加密 (AES-256-CBC)
- ✅ **RSA 加密** - 非對稱加密 (RSA-OAEP-SHA256)
- ✅ **SHA 哈希** - SHA-256 和 SHA-512
- ✅ **KDF 密鑰派生** - PBKDF2 和 Argon2
- ✅ **策略模式設計** - 易於擴展和維護
- ✅ **完整的單元測試** - 測試覆蓋率 > 80%
- ✅ **純前端實作** - 使用 Web Crypto API
- ✅ **TypeScript 類型提示** (即將推出)

## 安裝

```bash
npm install
```

## 快速開始

### 1. AES 加密 (對稱加密)

#### 方式一：指定 IV

```javascript
import { CryptoInitializer } from './src/index.js';

// 初始化設定
await CryptoInitializer.initAesSetting('你的密鑰', '你的IV');

// 加密
const aesContext = CryptoInitializer.getAesContextForEncrypt();
const encryptResult = await aesContext.encryptToBase64('你的明文');

if (encryptResult.success) {
  console.log('加密結果:', encryptResult.data);
}

// 解密
const decryptContext = CryptoInitializer.getAesContextForDecrypt();
const decryptResult = await decryptContext.decryptFromBase64(encryptResult.data);

if (decryptResult.success) {
  console.log('解密結果:', decryptResult.data);
}
```

#### 方式二:隨機 IV (推薦)

```javascript
// 初始化設定 (只需要密鑰)
await CryptoInitializer.initAesSetting('你的密鑰');

// 加密 (自動產生隨機 IV)
const aesContext = CryptoInitializer.getAesContextForEncryptByRandomIV();
const encryptResult = await aesContext.encryptWithIVToBase64('你的明文');

if (encryptResult.success) {
  console.log('加密結果:', encryptResult.cipherText);
  console.log('IV:', encryptResult.iv); // 記得保存 IV
}

// 解密 (使用保存的 IV)
const decryptContext = CryptoInitializer.getAesContextForDecryptByRandomIV(encryptResult.iv);
const decryptResult = await decryptContext.decryptFromBase64(encryptResult.cipherText);

if (decryptResult.success) {
  console.log('解密結果:', decryptResult.data);
}
```

#### 方式三:直接使用 (無需預先初始化)

```javascript
// 直接加密
const aesContext = await CryptoInitializer.getAesContextForEncryptDirect('你的密鑰', '你的IV');
const encryptResult = await aesContext.encryptToBase64('你的明文');

// 直接解密
const decryptContext = await CryptoInitializer.getAesContextForDecryptDirect('你的密鑰', ivBase64);
const decryptResult = await decryptContext.decryptFromBase64(encryptResult.data);
```

### 2. RSA 加密 (非對稱加密)

```javascript
import { CryptoInitializer } from './src/index.js';

// 產生金鑰對
const { publicKey, privateKey } = await CryptoInitializer.rsaGenerateKeys(2048);
console.log('公鑰:', publicKey);
console.log('私鑰:', privateKey);

// 方式一:初始化設定
await CryptoInitializer.initRsaSetting(publicKey, privateKey);

const rsaContext = CryptoInitializer.getRsaContext();

// 加密
const encryptResult = await rsaContext.encryptToBase64('你的明文');
if (encryptResult.success) {
  console.log('加密結果:', encryptResult.data);
}

// 解密
const decryptResult = await rsaContext.decryptFromBase64(encryptResult.data);
if (decryptResult.success) {
  console.log('解密結果:', decryptResult.data);
}

// 方式二:直接使用
const rsaContextDirect = await CryptoInitializer.getRsaContextDirect(publicKey, privateKey);
const result = await rsaContextDirect.encryptToBase64('直接加密的明文');
```

### 3. SHA 哈希

#### SHA-256

```javascript
import { CryptoInitializer } from './src/index.js';

const sha256Context = CryptoInitializer.getSha256HashContext();
const hashResult = await sha256Context.encryptToBase64('要哈希的文字');

if (hashResult.success) {
  console.log('SHA-256 哈希:', hashResult.data);
}
```

#### SHA-512

```javascript
const sha512Context = CryptoInitializer.getSha512HashContext();
const hashResult = await sha512Context.encryptToBase64('要哈希的文字');

if (hashResult.success) {
  console.log('SHA-512 哈希:', hashResult.data);
}
```

### 4. KDF 密鑰派生

#### 產生隨機鹽

```javascript
import { CryptoInitializer } from './src/index.js';

const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);
console.log('Base64 鹽:', base64Salt);
```

#### 從密碼派生密鑰 (使用 Argon2)

```javascript
const password = '使用者密碼';
const { bytesSalt } = CryptoInitializer.generateSalt(16);

// 派生密鑰
const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
  password, 
  bytesSalt,
  null, // 使用預設 Argon2 策略
  100000, // 迭代次數
  32 // 密鑰長度 (bytes)
);

console.log('派生的密鑰:', derivedKey);
```

#### 使用 PBKDF2

```javascript
import { Pbkdf2Strategy } from './src/index.js';

const pbkdf2Strategy = new Pbkdf2Strategy();
const derivedKey = await CryptoInitializer.deriveKeyFromPasswordToBase64(
  password,
  bytesSalt,
  pbkdf2Strategy,
  100000,
  32
);

console.log('PBKDF2 派生密鑰:', derivedKey);
```

#### 驗證密鑰

```javascript
const isValid = await CryptoInitializer.verifyDerivedKey(
  password,
  bytesSalt,
  derivedKey
);

console.log('密鑰驗證:', isValid ? '成功' : '失敗');
```

### 5. 完整範例:KDF + AES 密碼加密

```javascript
import { CryptoInitializer } from './src/index.js';

async function encryptWithPassword(plainText, password) {
  // 1. 產生隨機鹽
  const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);
  
  // 2. 從密碼派生密鑰
  const derivedKey = await CryptoInitializer.deriveKeyFromPassword(password, bytesSalt);
  
  // 3. 使用派生的密鑰進行 AES 加密
  const aesContext = CryptoInitializer.getAesContextForEncryptByRandomIV();
  aesContext.key = derivedKey;
  
  const encryptResult = await aesContext.encryptWithIVToBase64(plainText);
  
  return {
    cipherText: encryptResult.cipherText,
    iv: encryptResult.iv,
    salt: base64Salt
  };
}

async function decryptWithPassword(cipherText, iv, salt, password) {
  // 1. 從 Base64 轉換鹽
  const bytesSalt = CryptoInitializer._base64ToArrayBuffer(salt);
  
  // 2. 從密碼派生相同的密鑰
  const derivedKey = await CryptoInitializer.deriveKeyFromPassword(password, bytesSalt);
  
  // 3. 使用派生的密鑰進行 AES 解密
  const aesContext = CryptoInitializer.getAesContextForDecryptByRandomIV(iv);
  aesContext.key = derivedKey;
  
  const decryptResult = await aesContext.decryptFromBase64(cipherText);
  
  return decryptResult.data;
}

// 使用範例
const encrypted = await encryptWithPassword('機密資料', '使用者密碼123');
console.log('加密資料:', encrypted);

const decrypted = await decryptWithPassword(
  encrypted.cipherText,
  encrypted.iv,
  encrypted.salt,
  '使用者密碼123'
);
console.log('解密資料:', decrypted);
```

## 在靜態網站中使用

### HTML 引入方式

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>加密測試</title>
</head>
<body>
  <h1>前端加密測試</h1>
  
  <script type="module">
    import { CryptoInitializer } from './src/index.js';
    
    async function testEncryption() {
      // AES 加密測試
      await CryptoInitializer.initAesSetting('myKey', 'myIV');
      const aesContext = CryptoInitializer.getAesContextForEncrypt();
      
      const result = await aesContext.encryptToBase64('Hello World!');
      console.log('加密結果:', result.data);
      
      const decrypt = await aesContext.decryptFromBase64(result.data);
      console.log('解密結果:', decrypt.data);
    }
    
    testEncryption();
  </script>
</body>
</html>
```

## 執行測試

```bash
# 執行所有測試
npm test

# 監聽模式
npm run test:watch

# 測試覆蓋率
npm run test:coverage
```

## API 文件

### CryptoInitializer

主要的初始化器類別，提供所有加密操作的便捷方法。

#### AES 相關方法

- `initAesSetting(keyStr, ivStr?, useSha256ForKey?, useSha256ForIv?, isRandomBase64ForIv?)` - 初始化 AES 設定
- `getAesContextForEncrypt()` - 取得加密上下文 (指定 IV)
- `getAesContextForEncryptByRandomIV()` - 取得加密上下文 (隨機 IV)
- `getAesContextForDecrypt()` - 取得解密上下文
- `getAesContextForDecryptByRandomIV(ivStr)` - 取得解密上下文 (隨機 IV)

#### RSA 相關方法

- `rsaGenerateKeys(keySize?)` - 產生 RSA 金鑰對
- `initRsaSetting(publicKey, privateKey)` - 初始化 RSA 設定
- `getRsaContext()` - 取得 RSA 上下文
- `getRsaContextDirect(publicKey, privateKey)` - 直接取得 RSA 上下文

#### Hash 相關方法

- `getSha256HashContext()` - 取得 SHA-256 上下文
- `getSha512HashContext()` - 取得 SHA-512 上下文

#### KDF 相關方法

- `generateSalt(length?)` - 產生隨機鹽
- `deriveKeyFromPassword(password, salt, kdfStrategy?, iterations?, keyLengthBytes?)` - 派生密鑰
- `deriveKeyFromPasswordToBase64(...)` - 派生密鑰 (Base64)
- `verifyDerivedKey(password, salt, expectedKey, kdfStrategy?, iterations?)` - 驗證密鑰

## 架構設計

本函式庫採用**策略模式 (Strategy Pattern)**設計,使代碼易於擴展和維護:

```
src/
├── aes/                  # AES 加密模組
│   ├── IAesStrategy.js
│   ├── BasicAesStrategy.js
│   └── AesContext.js
├── rsa/                  # RSA 加密模組
│   ├── IRsaStrategy.js
│   ├── BasicRsaStrategy.js
│   └── RsaContext.js
├── hash/                 # 哈希模組
│   ├── IShaHashStrategy.js
│   ├── BasicSha256HashStrategy.js
│   ├── BasicSha512HashStrategy.js
│   └── ShaHashContext.js
├── kdf/                  # 密鑰派生模組
│   ├── IKdfStrategy.js
│   ├── Pbkdf2Strategy.js
│   ├── Argon2Strategy.js
│   └── KdfContext.js
├── common/               # 共用模組
│   └── CryptoInitializer.js
└── index.js             # 主入口
```

## 瀏覽器支援

需要支援以下 Web API:
- Web Crypto API (`crypto.subtle`)
- TextEncoder / TextDecoder
- Uint8Array

支援的瀏覽器:
- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 12+

## 安全建議

1. **不要在前端儲存私鑰或敏感密鑰**
2. **使用隨機 IV** - 每次加密都使用新的隨機 IV
3. **密鑰派生** - 使用 KDF (PBKDF2 或 Argon2) 從密碼派生密鑰
4. **HTTPS** - 確保網站使用 HTTPS
5. **密鑰管理** - 妥善保管密鑰和鹽值

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request!
