/**
 * Work Experience Repository Layer
 * 負責從遠端或本地載入工作經歷資料
 * 使用 DataFormatValidator 進行資料格式驗證（支援加密/非加密資料）
 */

import { DataFormatValidator } from '../components/DataFormatValidator.js';

export class WorkExperienceRepository {
  /**
   * 根據語言載入工作經歷資料
   * @param {string} language - 語言代碼 ('zh-TW', 'ja', 'en')
   * @returns {Promise<Object>} 工作經歷資料物件
   */
  static async loadWorkExperienceData(language = 'zh-TW') {
    try {
      const dataPath = this._getDataPath(language);
      console.log('📥 正在載入工作經歷資料...', dataPath);
      
      const response = await fetch(dataPath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 🔐 使用 DataFormatValidator 檢查是否為加密資料格式
      if (DataFormatValidator.isEncryptedDataFormat(data)) {
        console.log('🔐 偵測到加密資料格式，直接返回');
        return data;
      }
      
      // ✅ 非加密資料，使用 DataFormatValidator 驗證普通資料格式
      DataFormatValidator.validateWorkExperienceData(data);
      
      console.log('✅ 工作經歷資料載入成功');
      return data;
      
    } catch (error) {
      console.error('❌ 載入工作經歷資料失敗:', error.message);
      throw new Error(`Failed to load work experience data: ${error.message}`);
    }
  }
  
  /**
   * 根據語言取得資料檔案路徑
   * @param {string} language - 語言代碼
   * @returns {string} 資料檔案路徑
   * @private
   */
  static _getDataPath(language) {
    const paths = {
      'zh-TW': './data/work-experience-zh-TW.json',
      'ja': './data/work-experience-ja.json',
      'en': './data/work-experience-en.json'
    };
    
    if (!(language in paths)) {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    return paths[language];
  }
  
  /**
   * 取得所有工作經歷 (type='parent' 且 isDisplayed=true)
   * 同時過濾子專案中 isDisplayed=true 的項目
   * @param {Object} data - 工作經歷資料物件
   * @returns {Array} parent 類型的工作經歷陣列
   */
  static getParentWorkExperiences(data) {
    return data.workExperiences
      .filter(exp => exp.type === 'parent' && exp.isDisplayed !== false)
      .map(exp => ({
        ...exp,
        projects: Array.isArray(exp.projects)
          ? exp.projects.filter(project => project.isDisplayed !== false)
          : []
      }));
  }
  
  /**
   * 根據 ID 取得工作經歷資訊 (需檢查 isDisplayed)
   * 同時過濾子專案中 isDisplayed=true 的項目
   * @param {Object} data - 工作經歷資料物件
   * @param {string} id - 工作經歷 ID
   * @returns {Object|null} 工作經歷物件或 null
   */
  static getWorkExperienceById(data, id) {
    const exp = data.workExperiences.find(exp => exp.id === id) || null;
    
    if (!exp) return null;
    
    // 檢查是否應該顯示此工作經歷
    if (exp.isDisplayed === false) {
      return null;
    }
    
    // 過濾子專案中 isDisplayed=true 的項目
    return {
      ...exp,
      projects: Array.isArray(exp.projects)
        ? exp.projects.filter(project => project.isDisplayed !== false)
        : []
    };
  }
  
  /**
   * 根據 parent ID 取得所有子專案 (過濾 isDisplayed=true)
   * @param {Object} data - 工作經歷資料物件
   * @param {string} parentId - Parent 工作經歷 ID
   * @returns {Array} 子專案陣列
   */
  static getChildProjects(data, parentId) {
    const parentExp = this.getWorkExperienceById(data, parentId);
    if (!parentExp || !parentExp.projects) {
      return [];
    }
    
    return parentExp.projects.filter(project => project.type === 'child' && project.isDisplayed !== false);
  }
  
  /**
   * 驗證資料是否已加密
   * @param {Object} data - 資料物件
   * @returns {boolean} 是否已加密
   */
  static isEncrypted(data) {
    return data && data.encrypted === true;
  }
  
  /**
   * 取得資料的中繼資訊
   * @param {Object} data - 工作經歷資料物件
   * @returns {Object} 中繼資訊
   */
  static getMetadata(data) {
    return {
      version: data.version,
      lastUpdated: data.lastUpdated,
      totalCount: data.workExperiences.length,
      encrypted: data.encrypted || false
    };
  }
}
