/**
 * Index Repository Layer
 * 資料存取層 - 負責從 JSON 檔案讀取首頁資料（個人簡介、性格、標籤）
 * 
 * 支援加密和非加密資料格式
 * 路徑對應: data/resume-index-{language}.json
 */

import { DataFormatValidator } from '../components/DataFormatValidator.js';

export class IndexRepository {
  /**
   * 載入首頁資料（按語言）
   * 
   * 流程：
   * 1. 根據語言取得資料檔案路徑
   * 2. 從 JSON 檔案讀取資料
   * 3. 驗證資料格式（支援加密和非加密）
   * 4. 返回資料
   * 
   * @param {string} language - 語言代碼 ('zh-TW', 'ja', 'en')
   * @returns {Promise<Object>} 首頁資料或加密資料格式
   * @throws {Error} 如果檔案不存在或語言不支援
   */
  static async loadIndexData(language) {
    try {
      const dataPath = this._getDataPath(language);
      
      const response = await fetch(dataPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📥 首頁資料載入成功: ${language}`);
      
      // 檢查是否為加密資料格式
      if (DataFormatValidator.isEncryptedDataFormat(data)) {
        console.log('🔐 偵測到加密資料格式，直接返回');
        return data;
      }
      
      // 驗證非加密資料格式
      this._validateIndexData(data);
      
      console.log('✅ 首頁資料驗證成功');
      return data;
    } catch (error) {
      console.error('❌ 載入首頁資料失敗:', error.message);
      throw new Error(`Failed to load index data: ${error.message}`);
    }
  }

  /**
   * 取得首頁資料檔案路徑（按語言）
   * 
   * @private
   * @param {string} language - 語言代碼
   * @returns {string} 資料檔案路徑
   * @throws {Error} 如果語言不支援
   */
  static _getDataPath(language) {
    const paths = {
      'zh-TW': './data/resume-index-zh-TW.json',
      'ja': './data/resume-index-ja.json',
      'en': './data/resume-index-en.json'
    };

    if (!(language in paths)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    return paths[language];
  }

  /**
   * 驗證首頁資料格式
   * 
   * 必要欄位：
   * - index.introduction (string) - 個人簡介
   * - index.personality (string) - 人格特質
   * - tags (array) - 標籤列表，每個項目應包含 id, label, sort
   * 
   * @private
   * @param {Object} data - 首頁資料
   * @throws {Error} 如果資料格式無效
   */
  static _validateIndexData(data) {
    // 驗證頂層結構
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format: data must be an object');
    }

    // 驗證 index 物件
    if (!data.index || typeof data.index !== 'object') {
      throw new Error('Invalid data format: missing "index" object');
    }

    // 驗證必要的 index 欄位
    if (!data.index.introduction || typeof data.index.introduction !== 'string') {
      throw new Error('Invalid data format: missing or invalid "index.introduction"');
    }

    if (!data.index.personality || typeof data.index.personality !== 'string') {
      throw new Error('Invalid data format: missing or invalid "index.personality"');
    }

    // 驗證 tags 陣列
    if (!Array.isArray(data.tags)) {
      throw new Error('Invalid data format: "tags" must be an array');
    }

    // 驗證每個 tag 的結構
    for (let i = 0; i < data.tags.length; i++) {
      const tag = data.tags[i];
      if (!tag || typeof tag !== 'object') {
        throw new Error(`Invalid data format: tags[${i}] must be an object`);
      }
      if (!tag.id || typeof tag.id !== 'string') {
        throw new Error(`Invalid data format: tags[${i}].id is required and must be a string`);
      }
      if (!tag.label || typeof tag.label !== 'string') {
        throw new Error(`Invalid data format: tags[${i}].label is required and must be a string`);
      }
      if (typeof tag.sort !== 'number') {
        throw new Error(`Invalid data format: tags[${i}].sort must be a number`);
      }
    }

    console.log('✅ 首頁資料驗證完成');
  }

  /**
   * 根據 ID 查詢標籤
   * 
   * @param {Object} data - 首頁資料
   * @param {string} tagId - 標籤 ID
   * @returns {Object|null} 標籤物件或 null
   */
  static getTagById(data, tagId) {
    if (!data || !data.tags) return null;
    return data.tags.find(tag => tag.id === tagId) || null;
  }

  /**
   * 取得所有標籤（按 sort 排序）
   * 
   * @param {Object} data - 首頁資料
   * @returns {Array} 按 sort 排序的標籤陣列
   */
  static getSortedTags(data) {
    if (!data || !data.tags) return [];
    return [...data.tags].sort((a, b) => a.sort - b.sort);
  }

  /**
   * 取得個人簡介
   * 
   * @param {Object} data - 首頁資料
   * @returns {string} 個人簡介文本
   */
  static getIntroduction(data) {
    return data?.index?.introduction || '';
  }

  /**
   * 取得人格特質
   * 
   * @param {Object} data - 首頁資料
   * @returns {string} 人格特質文本
   */
  static getPersonality(data) {
    return data?.index?.personality || '';
  }

  /**
   * 取得中繼資訊
   * 
   * @param {Object} data - 首頁資料
   * @returns {Object} 包含版本、更新時間等資訊
   */
  static getMetadata(data) {
    return {
      version: data?.version || '1.0',
      lastUpdated: data?.lastUpdated || 'unknown',
      totalTags: data?.metadata?.totalTags || (data?.tags?.length || 0)
    };
  }
}
