/**
 * Data Repository Layer
 * 負責從遠端或本地載入加密的資料
 */

export class DataRepository {
  /**
   * 從指定路徑載入加密的 JSON 資料
   * @param {string} dataPath - 資料檔案路徑
   * @returns {Promise<Object>} 加密的資料物件
   */
  static async loadEncryptedData(dataPath = './data/resume-data.json') {
    try {
      const response = await fetch(dataPath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const encryptedData = await response.json();
      
      // 驗證資料格式
      this._validateEncryptedData(encryptedData);
      
      return encryptedData;
      
    } catch (error) {
      console.error('❌ 載入加密資料失敗:', error.message);
      throw new Error(`Failed to load encrypted data: ${error.message}`);
    }
  }
  
  /**
   * 驗證加密資料格式是否正確
   * @param {Object} data - 加密資料物件
   * @private
   */
  static _validateEncryptedData(data) {
    const requiredFields = ['version', 'encrypted', 'algorithm', 'salt', 'iv', 'cipherText'];
    
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!data.encrypted) {
      throw new Error('Data is not encrypted');
    }
  }
  
  /**
   * 取得加密資料的詳細資訊
   * @param {Object} encryptedData - 加密資料物件
   * @returns {Object} 加密資訊
   */
  static getEncryptionInfo(encryptedData) {
    return {
      version: encryptedData.version,
      algorithm: encryptedData.algorithm,
      kdf: encryptedData.kdf,
      iterations: encryptedData.iterations,
      timestamp: encryptedData.timestamp,
      description: encryptedData.description
    };
  }
  
  /**
   * 檢查資料是否已加密
   * @param {Object} data - 資料物件
   * @returns {boolean} 是否已加密
   */
  static isEncrypted(data) {
    return data && data.encrypted === true;
  }
}
