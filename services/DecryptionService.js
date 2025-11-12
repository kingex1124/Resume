/**
 * Decryption Service Layer
 * 負責處理資料解密的商業邏輯
 */

import { CryptoInitializer, Pbkdf2Strategy, AesContext, BasicAesStrategy } from '../crypto-js-lib/src/index.js';

export class DecryptionService {
  /**
   * 使用密碼解密加密的資料
   * @param {string} password - 使用者輸入的密碼
   * @param {Object} encryptedData - 加密的資料物件
   * @returns {Promise<Object>} 解密後的資料
   */
  static async decryptData(password, encryptedData) {
    try {
      // 1. 驗證必要欄位
      this._validateDecryptionParams(password, encryptedData);
      
      // 2. 從 Base64 轉換鹽
      const salt = this._base64ToUint8Array(encryptedData.salt);
      
      // 3. 使用密碼和鹽派生密鑰
      const derivedKey = await this._deriveKey(
        password,
        salt,
        encryptedData.iterations || 100000
      );
      
      // 4. 使用派生的密鑰進行 AES 解密
      const decryptedJson = await this._decryptWithAES(
        derivedKey,
        encryptedData.iv,
        encryptedData.cipherText
      );
      
      // 5. 解析 JSON
      const data = JSON.parse(decryptedJson);
      
      return {
        success: true,
        data: data,
        message: '資料解密成功'
      };
      
    } catch (error) {
      console.error('❌ 解密失敗:', error.message);
      
      // 判斷錯誤類型
      if (error.message.includes('Decryption failed')) {
        return {
          success: false,
          data: null,
          message: '密碼錯誤或資料已損壞'
        };
      }
      
      return {
        success: false,
        data: null,
        message: `解密失敗: ${error.message}`
      };
    }
  }
  
  /**
   * 驗證解密參數
   * @param {string} password - 密碼
   * @param {Object} encryptedData - 加密資料
   * @private
   */
  static _validateDecryptionParams(password, encryptedData) {
    if (!password || password.trim().length === 0) {
      throw new Error('密碼不能為空');
    }
    
    if (!encryptedData) {
      throw new Error('加密資料不能為空');
    }
    
    const requiredFields = ['salt', 'iv', 'cipherText'];
    for (const field of requiredFields) {
      if (!encryptedData[field]) {
        throw new Error(`缺少必要欄位: ${field}`);
      }
    }
  }
  
  /**
   * 從密碼派生密鑰
   * @param {string} password - 密碼
   * @param {Uint8Array} salt - 鹽
   * @param {number} iterations - 迭代次數
   * @returns {Promise<Uint8Array>} 派生的密鑰
   * @private
   */
  static async _deriveKey(password, salt, iterations) {
    try {
      const pbkdf2 = new Pbkdf2Strategy();
      const derivedKey = await CryptoInitializer.deriveKeyFromPassword(
        password,
        salt,
        pbkdf2,
        iterations,
        32 // 256 位元密鑰
      );
      return derivedKey;
    } catch (error) {
      throw new Error(`密鑰派生失敗: ${error.message}`);
    }
  }
  
  /**
   * 使用 AES 解密
   * @param {Uint8Array} key - 解密密鑰
   * @param {string} iv - Base64 編碼的 IV
   * @param {string} cipherText - Base64 編碼的密文
   * @returns {Promise<string>} 解密後的明文
   * @private
   */
  static async _decryptWithAES(key, iv, cipherText) {
    try {
      // 直接創建 AesContext 並設置密鑰和 IV
      const aesContext = new AesContext(new BasicAesStrategy());

      aesContext.key = key;
      aesContext.iv = this._base64ToUint8Array(iv);
      
      const result = await aesContext.decryptFromBase64(cipherText);
      
      if (!result.success) {
        throw new Error('AES 解密失敗');
      }
      
      return result.data;
    } catch (error) {
      throw new Error(`AES 解密失敗: ${error.message}`);
    }
  }
  
  /**
   * 將 Base64 字串轉換為 Uint8Array
   * @param {string} base64 - Base64 字串
   * @returns {Uint8Array} 位元組陣列
   * @private
   */
  static _base64ToUint8Array(base64) {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      throw new Error(`Base64 解碼失敗: ${error.message}`);
    }
  }
  
  /**
   * 快速驗證密碼（不完全解密，只檢查密鑰派生）
   * 注意：這個方法無法真正驗證密碼是否正確，只能嘗試解密
   * @param {string} password - 密碼
   * @param {Object} encryptedData - 加密資料
   * @returns {Promise<boolean>} 密碼是否可能正確
   */
  static async validatePassword(password, encryptedData) {
    try {
      const result = await this.decryptData(password, encryptedData);
      return result.success;
    } catch (error) {
      return false;
    }
  }
}
