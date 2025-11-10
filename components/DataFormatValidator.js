/**
 * Data Format Validator Component
 * 共用資料格式驗證工具
 * 
 * 用途：
 * - 驗證資料是否為加密格式
 * - 驗證資料是否為普通 JSON 格式
 * - 支援多個 Repository 共用
 * 
 * 使用方式：
 *   import { DataFormatValidator } from './components/DataFormatValidator.js';
 *   
 *   if (DataFormatValidator.isEncryptedDataFormat(data)) {
 *     // 處理加密資料
 *   } else {
 *     // 驗證普通資料格式
 *     DataFormatValidator.validatePlainDataFormat(data, requiredFields);
 *   }
 */

export class DataFormatValidator {
  /**
   * 加密資料格式的標誌欄位
   * @private
   */
  static #ENCRYPTED_DATA_MARKERS = [
    'encrypted',
    'algorithm',
    'cipherText',
    'iv',
    'salt',
    'kdf'
  ];

  /**
   * 檢查資料是否為加密資料格式
   * 
   * @param {Object} data - 要驗證的資料物件
   * @returns {boolean} 是否為加密資料格式
   * 
   * @example
   *   const isEncrypted = DataFormatValidator.isEncryptedDataFormat(data);
   */
  static isEncryptedDataFormat(data) {
    // 1. 基本型態檢查
    if (!data || typeof data !== 'object') {
      return false;
    }

    // 2. 檢查是否包含 encrypted: true 標誌
    if (data.encrypted !== true) {
      return false;
    }

    // 3. 檢查是否包含加密資料的標誌欄位
    const hasEncryptionMarkers = this.#ENCRYPTED_DATA_MARKERS.some(
      (marker) => marker in data
    );

    if (hasEncryptionMarkers) {
      console.log('✅ 識別為加密資料格式:', {
        encrypted: data.encrypted,
        algorithm: data.algorithm,
        kdf: data.kdf,
        iterations: data.iterations,
        timestamp: data.timestamp
      });
      return true;
    }

    return false;
  }

  /**
   * 驗證普通（非加密）資料格式
   * 
   * @param {Object} data - 要驗證的資料物件
   * @param {Array<string>} requiredFields - 必須包含的欄位名稱陣列
   * @throws {Error} 當資料格式不符時拋出錯誤
   * 
   * @example
   *   DataFormatValidator.validatePlainDataFormat(data, [
   *     'version',
   *     'lastUpdated',
   *     'workExperiences'
   *   ]);
   */
  static validatePlainDataFormat(data, requiredFields = []) {
    // 1. 檢查資料型態
    if (!data || typeof data !== 'object') {
      throw new Error('資料必須是物件類型');
    }

    // 2. 檢查是否已加密（避免驗證加密資料）
    if (this.isEncryptedDataFormat(data)) {
      throw new Error('資料已加密，請先解密後再驗證');
    }

    // 3. 檢查必須欄位
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`缺少必須欄位: ${field}`);
      }
    }

    console.log(`✅ 普通資料格式驗證通過 (${requiredFields.length} 個必須欄位)`);
    return true;
  }

  /**
   * 驗證資料是否包含特定結構（如陣列欄位）
   * 
   * @param {Object} data - 要驗證的資料物件
   * @param {string} fieldName - 欄位名稱
   * @param {string} expectedType - 期望的型態 ('array', 'object', 'string', etc.)
   * @throws {Error} 當欄位型態不符時拋出錯誤
   * 
   * @example
   *   DataFormatValidator.validateFieldType(data, 'workExperiences', 'array');
   */
  static validateFieldType(data, fieldName, expectedType) {
    if (!(fieldName in data)) {
      throw new Error(`欄位不存在: ${fieldName}`);
    }

    const field = data[fieldName];
    let actualType;

    if (expectedType === 'array') {
      actualType = Array.isArray(field) ? 'array' : typeof field;
    } else {
      actualType = typeof field;
    }

    if (actualType !== expectedType) {
      throw new Error(
        `欄位 ${fieldName} 型態錯誤: 期望 ${expectedType}，實際 ${actualType}`
      );
    }

    console.log(`✅ 欄位型態驗證通過: ${fieldName} 為 ${expectedType}`);
    return true;
  }

  /**
   * 驗證工作經歷資料格式（包含結構檢查）
   * 
   * @param {Object} data - 工作經歷資料物件
   * @throws {Error} 當資料格式不符時拋出錯誤
   * 
   * @example
   *   DataFormatValidator.validateWorkExperienceData(data);
   */
  static validateWorkExperienceData(data) {
    const requiredFields = ['version', 'lastUpdated', 'workExperiences'];

    // 1. 驗證必須欄位
    this.validatePlainDataFormat(data, requiredFields);

    // 2. 驗證 workExperiences 是陣列
    this.validateFieldType(data, 'workExperiences', 'array');

    console.log(
      `✅ 工作經歷資料格式驗證通過 (${data.workExperiences.length} 筆)`
    );
    return true;
  }

  /**
   * 驗證個人資料格式
   * 
   * @param {Object} data - 個人資料物件
   * @throws {Error} 當資料格式不符時拋出錯誤
   * 
   * @example
   *   DataFormatValidator.validatePersonalData(data);
   */
  static validatePersonalData(data) {
    const requiredFields = [
      'version',
      'lastUpdated',
      'personal',
      'skills',
      'education',
      'experience',
      'projects',
      'certifications'
    ];

    // 1. 驗證必須欄位
    this.validatePlainDataFormat(data, requiredFields);

    // 2. 驗證主要結構
    this.validateFieldType(data, 'personal', 'object');
    this.validateFieldType(data, 'skills', 'array');
    this.validateFieldType(data, 'education', 'array');
    this.validateFieldType(data, 'experience', 'array');
    this.validateFieldType(data, 'projects', 'array');
    this.validateFieldType(data, 'certifications', 'array');

    console.log('✅ 個人資料格式驗證通過');
    return true;
  }

  /**
   * 取得資料格式資訊
   * 
   * @param {Object} data - 資料物件
   * @returns {Object} 格式資訊
   * 
   * @example
   *   const info = DataFormatValidator.getFormatInfo(data);
   *   // { isEncrypted: true, hasRequiredFields: [...], metadata: {...} }
   */
  static getFormatInfo(data) {
    const isEncrypted = this.isEncryptedDataFormat(data);

    return {
      isEncrypted: isEncrypted,
      type: isEncrypted ? 'encrypted' : 'plain',
      hasVersion: 'version' in data,
      hasTimestamp: 'timestamp' in data || 'lastUpdated' in data,
      encryptionAlgorithm: isEncrypted ? data.algorithm : null,
      kdfAlgorithm: isEncrypted ? data.kdf : null,
      iterations: isEncrypted ? data.iterations : null,
      metadata: {
        version: data.version || null,
        lastUpdated: data.lastUpdated || data.timestamp || null
      }
    };
  }

  /**
   * 列出資料中所有的鍵值（用於除錯）
   * 
   * @param {Object} data - 資料物件
   * @returns {Array<string>} 所有鍵名稱
   * 
   * @example
   *   const keys = DataFormatValidator.getDataKeys(data);
   *   console.log('資料包含欄位:', keys);
   */
  static getDataKeys(data) {
    if (!data || typeof data !== 'object') {
      return [];
    }
    return Object.keys(data);
  }

  /**
   * 驗證資料大小（用於效能考量）
   * 
   * @param {Object} data - 資料物件
   * @param {number} maxSizeKB - 最大允許大小 (KB)
   * @returns {Object} { isValid: boolean, sizeKB: number, message: string }
   * 
   * @example
   *   const result = DataFormatValidator.validateDataSize(data, 10000);
   */
  static validateDataSize(data, maxSizeKB = 10000) {
    try {
      const jsonString = JSON.stringify(data);
      const sizeKB = new Blob([jsonString]).size / 1024;

      if (sizeKB > maxSizeKB) {
        return {
          isValid: false,
          sizeKB: sizeKB.toFixed(2),
          message: `資料過大: ${sizeKB.toFixed(2)} KB (限制: ${maxSizeKB} KB)`
        };
      }

      return {
        isValid: true,
        sizeKB: sizeKB.toFixed(2),
        message: `資料大小: ${sizeKB.toFixed(2)} KB (合格)`
      };
    } catch (error) {
      return {
        isValid: false,
        sizeKB: 0,
        message: `無法計算資料大小: ${error.message}`
      };
    }
  }
}
