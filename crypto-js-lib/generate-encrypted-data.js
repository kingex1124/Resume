/**
 * 生成加密的 JSON 資料
 * 這個腳本會創建範例資料並使用 AES 加密
 */

import { CryptoInitializer, Pbkdf2Strategy, AesContext, BasicAesStrategy } from './src/index.js';
import fs from 'fs';
import path from 'path';

// 預設密碼（可以修改）
const DEFAULT_PASSWORD = 'mySecurePassword123';

// 範例資料
const sampleData = {
  personal: {
    name: '張三',
    title: '全端工程師',
    email: 'contact@example.com',
    phone: '+886-912-345-678',
    location: '台北市, 台灣',
    bio: '熱愛技術創新，專注於前後端開發，具有 5 年以上開發經驗。'
  },
  skills: [
    { category: 'Frontend', items: ['React', 'Vue.js', 'TypeScript', 'HTML5', 'CSS3'] },
    { category: 'Backend', items: ['Node.js', 'Python', 'Java', 'C#', '.NET Core'] },
    { category: 'Database', items: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL'] },
    { category: 'DevOps', items: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Azure'] },
    { category: 'Crypto', items: ['AES', 'RSA', 'SHA', 'PBKDF2', 'Argon2'] }
  ],
  experience: [
    {
      company: 'ABC 科技公司',
      position: '資深全端工程師',
      period: '2020.01 - 現在',
      description: '負責企業級應用系統開發，包含前後端架構設計、API 開發、資料庫優化等。',
      achievements: [
        '建立完整的微服務架構，提升系統可擴展性 300%',
        '開發加密通訊模組，確保資料傳輸安全',
        '優化資料庫查詢效能，平均回應時間減少 70%'
      ]
    },
    {
      company: 'XYZ 新創公司',
      position: '前端工程師',
      period: '2018.06 - 2019.12',
      description: '負責電商平台前端開發，使用 React 和 TypeScript。',
      achievements: [
        '開發 RWD 響應式網站，支援多種裝置',
        '實作購物車和金流系統整合',
        '建立 UI 元件庫，提升開發效率 50%'
      ]
    }
  ],
  projects: [
    {
      name: 'Crypto JS Library',
      description: '完整的前端加密函式庫，提供 AES、RSA、SHA、KDF 等加密功能',
      tech: ['JavaScript', 'Web Crypto API', 'Jest'],
      url: 'https://github.com/username/crypto-js-lib'
    },
    {
      name: '企業級管理系統',
      description: '使用微服務架構的企業資源規劃系統',
      tech: ['Node.js', 'React', 'PostgreSQL', 'Docker', 'Kubernetes'],
      url: 'https://example.com/project'
    },
    {
      name: '即時通訊平台',
      description: '支援端到端加密的即時通訊應用',
      tech: ['WebSocket', 'Socket.io', 'AES-256', 'Vue.js'],
      url: 'https://example.com/chat'
    }
  ],
  education: [
    {
      school: '國立台灣大學',
      degree: '資訊工程學系 碩士',
      period: '2016 - 2018',
      gpa: '4.0 / 4.0'
    },
    {
      school: '國立台灣大學',
      degree: '資訊工程學系 學士',
      period: '2012 - 2016',
      gpa: '3.8 / 4.0'
    }
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect', year: 2022 },
    { name: 'Google Cloud Professional Developer', year: 2021 },
    { name: 'Microsoft Azure Developer Associate', year: 2020 }
  ]
};

async function generateEncryptedData() {
  try {
    console.log('🔐 開始生成加密資料...');
    
    // 1. 產生隨機鹽
    const { base64Salt, bytesSalt } = CryptoInitializer.generateSalt(16);
    console.log('✅ 已生成隨機鹽');
    
    // 2. 使用 PBKDF2 從密碼派生密鑰
    const pbkdf2 = new Pbkdf2Strategy();
    const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
      DEFAULT_PASSWORD,
      bytesSalt,
      pbkdf2,
      100000, // 100,000 次迭代
      32      // 256 位元密鑰
    );
    console.log('✅ 已派生加密密鑰');
    
    // 3. 將資料轉換為 JSON 字串
    const jsonString = JSON.stringify(sampleData, null, 2);
    console.log('✅ 已序列化資料');
    
    // 4. 生成隨機 IV
    const iv = crypto.getRandomValues(new Uint8Array(16));
    console.log('✅ 已生成隨機 IV');
    
    // 5. 使用 AES 加密 - 直接創建 context
    const aesContext = new AesContext(new BasicAesStrategy());
    aesContext.key = derivedKey;
    aesContext.iv = iv;
    
    const encryptResult = await aesContext.encryptToBase64(jsonString);
    
    if (!encryptResult.success) {
      throw new Error('加密失敗');
    }
    
    // 將 IV 轉換為 Base64
    const ivBase64 = Buffer.from(iv).toString('base64');
    
    console.log('✅ 已加密資料');
    
    // 6. 建立加密資料結構
    const encryptedData = {
      version: '1.0',
      encrypted: true,
      algorithm: 'AES-256-CBC',
      kdf: 'PBKDF2-SHA256',
      iterations: 100000,
      salt: base64Salt,
      iv: ivBase64,
      cipherText: encryptResult.data,
      timestamp: new Date().toISOString(),
      description: '此檔案包含加密的履歷資料，需要正確的密碼才能解密'
    };
    
    // 7. 儲存到檔案
    const dataDir = path.join(process.cwd(), '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const outputPath = path.join(dataDir, 'resume-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(encryptedData, null, 2), 'utf-8');
    
    console.log('✅ 已儲存加密資料到:', outputPath);
    console.log('');
    console.log('📋 加密資訊:');
    console.log('  密碼:', DEFAULT_PASSWORD);
    console.log('  演算法:', encryptedData.algorithm);
    console.log('  KDF:', encryptedData.kdf);
    console.log('  迭代次數:', encryptedData.iterations);
    console.log('');
    console.log('🎉 完成！');
    
  } catch (error) {
    console.error('❌ 發生錯誤:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 執行
generateEncryptedData();
