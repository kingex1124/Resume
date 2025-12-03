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
      
      const response = await fetch(dataPath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 🔐 使用 DataFormatValidator 檢查是否為加密資料格式
      if (DataFormatValidator.isEncryptedDataFormat(data)) {
        return data;
      }
      
      // ✅ 非加密資料，使用 DataFormatValidator 驗證普通資料格式
      DataFormatValidator.validateWorkExperienceData(data);
      
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

  /**
   * 取得所有專案的技術標籤統計
   * 統計所有 isDisplayed=true 的 parent 中的 projects.tags
   * @param {Object} data - 工作經歷資料物件
   * @returns {Object} { totalProjects: number, skills: [{ name: string, count: number, percentage: number }] }
   */
  static getAllProjectTagsStats(data) {
    if (!data || !data.workExperiences) {
      return { totalProjects: 0, skills: [] };
    }

    const tagCounts = {};
    let totalProjects = 0;

    // 遍歷所有 parent 工作經歷
    data.workExperiences
      .filter(exp => exp.type === 'parent' && exp.isDisplayed !== false)
      .forEach(exp => {
        // 遍歷每個 parent 中的 projects
        if (Array.isArray(exp.projects)) {
          exp.projects
            .filter(project => project.isDisplayed !== false)
            .forEach(project => {
              totalProjects++;
              
              // 統計 tags
              if (Array.isArray(project.tags)) {
                project.tags.forEach(tag => {
                  const tagName = typeof tag === 'string' ? tag : tag.name || tag.label || '';
                  if (tagName) {
                    tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
                  }
                });
              }
            });
        }
      });

    // 轉換為陣列並計算百分比
    const skills = Object.entries(tagCounts).map(([name, count]) => ({
      name,
      count,
      percentage: totalProjects > 0 ? (count / totalProjects) * 100 : 0
    }));

    // 按使用次數排序（高到低）
    skills.sort((a, b) => b.count - a.count);

    return { totalProjects, skills };
  }

  /**
   * 取得所有不重複的技術標籤列表
   * @param {Object} data - 工作經歷資料物件
   * @returns {Array<string>} 不重複的標籤列表
   */
  static getAllUniqueTags(data) {
    const stats = this.getAllProjectTagsStats(data);
    return stats.skills.map(skill => skill.name);
  }
}
