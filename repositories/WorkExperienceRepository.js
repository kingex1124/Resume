/**
 * Work Experience Repository Layer
 * 負責從遠端或本地載入工作經歷資料
 * 未來將改為像 DataRepository 一樣讀取加密資料
 */

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
      
      // 驗證資料格式
      this._validateWorkExperienceData(data);
      
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
   * 驗證工作經歷資料格式
   * @param {Object} data - 工作經歷資料物件
   * @private
   */
  static _validateWorkExperienceData(data) {
    const requiredFields = ['version', 'lastUpdated', 'workExperiences'];
    
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!Array.isArray(data.workExperiences)) {
      throw new Error('workExperiences must be an array');
    }
    
    console.log(`✅ 工作經歷資料格式驗證通過 (${data.workExperiences.length} 筆)`);
  }
  
  /**
   * 取得所有工作經歷 (type='parent')
   * @param {Object} data - 工作經歷資料物件
   * @returns {Array} parent 類型的工作經歷陣列
   */
  static getParentWorkExperiences(data) {
    return data.workExperiences.filter(exp => exp.type === 'parent');
  }
  
  /**
   * 根據 ID 取得工作經歷資訊
   * @param {Object} data - 工作經歷資料物件
   * @param {string} id - 工作經歷 ID
   * @returns {Object|null} 工作經歷物件或 null
   */
  static getWorkExperienceById(data, id) {
    return data.workExperiences.find(exp => exp.id === id) || null;
  }
  
  /**
   * 根據 parent ID 取得所有子專案
   * @param {Object} data - 工作經歷資料物件
   * @param {string} parentId - Parent 工作經歷 ID
   * @returns {Array} 子專案陣列
   */
  static getChildProjects(data, parentId) {
    const parentExp = this.getWorkExperienceById(data, parentId);
    if (!parentExp || !parentExp.projects) {
      return [];
    }
    
    return parentExp.projects.filter(project => project.type === 'child');
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
