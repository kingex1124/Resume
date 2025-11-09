/**
 * Work Experience Service Layer
 * 處理工作經歷資料的業務邏輯：排序、格式化、對話框資料準備等、翻譯管理
 * 也包含事件處理方法
 */

import { WorkExperienceRepository } from '../repositories/WorkExperienceRepository.js';
import { i18nService } from './i18nService.js';
import { WorkExperienceModal } from '../components/WorkExperienceModal.js';

export class WorkExperienceService {
  // 快取工作經歷翻譯資料
  static #translationCache = {};

  // 應用狀態
  static #appState = {
    currentLanguage: 'zh-TW',
    sortedRows: [],
    parentExperiences: {},
    translations: null
  };

  // 事件回調引用（用於語言切換和其他事件）
  static #eventCallbacks = {
    onLanguageChange: null,
    onTableRowClick: null
  };
  /**
   * 初始化並取得排序後的工作經歷資料
   * @param {string} language - 語言代碼
   * @returns {Promise<Array>} 排序後的工作經歷陣列
   */
  static async initializeAndSortWorkExperiences(language = 'zh-TW') {
    try {
      const data = await WorkExperienceRepository.loadWorkExperienceData(language);
      const parentExps = WorkExperienceRepository.getParentWorkExperiences(data);
      
      // 按期間開始時間排序（近到遠）
      return this._sortByPeriodStart(parentExps);
    } catch (error) {
      console.error('❌ 初始化工作經歷資料失敗:', error.message);
      throw error;
    }
  }
  
  /**
   * 按期間開始時間排序工作經歷（近的在上）
   * @param {Array} experiences - 工作經歷陣列
   * @returns {Array} 排序後的陣列
   * @private
   */
  static _sortByPeriodStart(experiences) {
    return [...experiences].sort((a, b) => {
      const dateA = this._parsePeriodDate(a.period.start);
      const dateB = this._parsePeriodDate(b.period.start);
      return dateB - dateA; // 降序排列
    });
  }
  
  /**
   * 解析期間日期字串 (e.g., "2025.3" -> 20250300)
   * @param {string} dateStr - 日期字串
   * @returns {number} 可比較的數值
   * @private
   */
  static _parsePeriodDate(dateStr) {
    const [year, month] = dateStr.split('.');
    return parseInt(year + (month.padStart(2, '0') + '00'));
  }
  
  /**
   * 準備主列表顯示的行資料（parent 和 child 混合）
   * @param {Array} sortedParentExps - 排序後的 parent 工作經歷
   * @returns {Array} 主列表行資料 [{ type: 'parent'|'child', data: {...} }]
   */
  static prepareMainTableRows(sortedParentExps) {
    const rows = [];
    
    for (const parentExp of sortedParentExps) {
      // 先加入 parent 行
      rows.push({
        type: 'parent',
        data: parentExp
      });
      
      // 再加入排序後的 child 專案行
      if (parentExp.projects && parentExp.projects.length > 0) {
        const sortedProjects = this._sortProjectsByEndDate(parentExp.projects);
        
        for (const project of sortedProjects) {
          if (project.type === 'child') {
            rows.push({
              type: 'child',
              parentId: parentExp.id,
              data: project
            });
          }
        }
      }
    }
    
    return rows;
  }
  
  /**
   * 按結束日期排序專案（最近的在上）
   * @param {Array} projects - 專案陣列
   * @returns {Array} 排序後的專案陣列
   * @private
   */
  static _sortProjectsByEndDate(projects) {
    return [...projects].sort((a, b) => {
      // 如果有多個 periods，取最後一個的 end 日期
      const endDateA = this._getLatestEndDate(a.periods);
      const endDateB = this._getLatestEndDate(b.periods);
      
      const numA = this._parsePeriodDate(endDateA);
      const numB = this._parsePeriodDate(endDateB);
      
      return numB - numA; // 降序
    });
  }
  
  /**
   * 取得最近的結束日期
   * @param {Array} periods - 期間陣列
   * @returns {string} 最後一個 end 日期
   * @private
   */
  static _getLatestEndDate(periods) {
    if (!periods || periods.length === 0) return '2000.1';
    
    let latestDate = periods[0].end;
    let latestNum = this._parsePeriodDate(latestDate);
    
    for (const period of periods.slice(1)) {
      const currentNum = this._parsePeriodDate(period.end);
      if (currentNum > latestNum) {
        latestNum = currentNum;
        latestDate = period.end;
      }
    }
    
    return latestDate;
  }
  
  /**
   * 格式化期間顯示文本
   * @param {Object} period - 期間物件 { start, end, duration }
   * @returns {string} 格式化文本 e.g., "2025.3 ~ 2025.8 (5個月)"
   */
  static formatPeriodText(period) {
    if (!period) return '';
    const { start, end, duration } = period;
    return `${start} ~ ${end} (${duration})`;
  }
  
  /**
   * 準備 Parent 詳情對話框資料
   * @param {Object} parentExp - Parent 工作經歷物件
   * @returns {Object} 對話框資料
   */
  static prepareParentModalData(parentExp) {
    return {
      title: parentExp.company.name,
      period: this.formatPeriodText(parentExp.period),
      workingDays: parentExp.workingDays,
      summary: parentExp.summary,
      projects: this._sortProjectsByEndDate(parentExp.projects || [])
    };
  }
  
  /**
   * 準備 Child 專案詳情對話框資料
   * @param {Object} project - Child 專案物件
   * @returns {Object} 對話框資料
   */
  static prepareChildModalData(project) {
    return {
      title: project.name,
      periods: this._formatMultiplePeriods(project.periods || []),
      workingDays: project.details?.overview?.workingDays,
      role: project.role,
      content: project.details?.content || { sections: [] }
    };
  }
  
  /**
   * 格式化多個期間的顯示文本
   * @param {Array} periods - 期間陣列
   * @returns {string} 格式化文本，多筆時折行顯示
   * @private
   */
  static _formatMultiplePeriods(periods) {
    if (!periods || periods.length === 0) return '';
    
    return periods
      .map(period => this.formatPeriodText(period))
      .join('\n');
  }
  
  /**
   * 格式化表格行的顯示資料
   * @param {Object} rowData - 行資料 { type, data, parentId }
   * @returns {Object} 格式化後的顯示資料
   */
  static formatTableRowDisplay(rowData) {
    const { type, data } = rowData;
    
    if (type === 'parent') {
      return {
        type: 'parent',
        period: this.formatPeriodText(data.period),
        company: data.company.name,
        summary: data.summary,
        id: data.id
      };
    } else if (type === 'child') {
      return {
        type: 'child',
        periods: this._formatMultiplePeriods(data.periods),
        name: data.name,
        role: data.role,
        id: data.id
      };
    }
    
    return null;
  }
  
  /**
   * 取得 Parent 工作經歷的所有 child 專案
   * @param {Object} parentExp - Parent 工作經歷物件
   * @returns {Array} 排序後的 child 專案陣列
   */
  static getParentChildProjects(parentExp) {
    if (!parentExp.projects) return [];
    
    const childProjects = parentExp.projects.filter(p => p.type === 'child');
    return this._sortProjectsByEndDate(childProjects);
  }
  
  /**
   * 驗證 ID 是否為有效的工作經歷 ID（parent）
   * @param {string} id - ID 字串
   * @returns {boolean} 是否為 parent ID
   */
  static isParentId(id) {
    // Parent ID 格式：C001, C002, ... (字母 + 數字)
    return /^C\d{3}$/.test(id);
  }
  
  /**
   * 驗證 ID 是否為有效的專案 ID（child）
   * @param {string} id - ID 字串
   * @returns {boolean} 是否為 child ID
   */
  static isChildId(id) {
    // Child ID 格式：C001P001, C001P002, ... (字母 + 數字 + P + 數字)
    return /^C\d{3}P\d{3}$/.test(id);
  }
  
  /**
   * 從 child ID 提取 parent ID
   * @param {string} childId - Child ID
   * @returns {string|null} Parent ID 或 null
   */
  static extractParentIdFromChildId(childId) {
    if (!this.isChildId(childId)) return null;
    return childId.substring(0, 4); // 取前 4 個字元 (e.g., "C001")
  }

  // ============================================
  // 翻譯相關方法
  // ============================================

  /**
   * 加載工作經歷模組的翻譯資料
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 工作經歷翻譯物件
   */
  static async loadWorkExperienceTranslations(language) {
    try {
      const cacheKey = `work-experience_${language}`;
      
      // 檢查本地快取
      if (this.#translationCache[cacheKey]) {
        console.log(`📦 使用本地快取翻譯: ${cacheKey}`);
        return this.#translationCache[cacheKey];
      }

      // 從 i18nService 加載翻譯
      const translations = await i18nService.loadModuleTranslations('work-experience', language);
      
      // 快取翻譯資料
      this.#translationCache[cacheKey] = translations;
      
      return translations;
    } catch (error) {
      console.error('❌ 加載工作經歷翻譯失敗:', error.message);
      throw error;
    }
  }

  /**
   * 取得工作經歷 UI 文本（工作經歷特定模組的翻譯）
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 包含所有 UI 文本的翻譯物件
   */
  static async getWorkExperienceUIText(language) {
    const translations = await this.loadWorkExperienceTranslations(language);
    
    return {
      title: translations?.workExperience?.title || '工作經歷',
      period: translations?.workExperience?.period || '期間',
      project: translations?.workExperience?.project || '專案/項目',
      role: translations?.workExperience?.role || '職務/內容',
      workingDays: translations?.workExperience?.workingDays || '工作天數',
      modal: translations?.workExperience?.modal || {},
      navigation: translations?.navigation || {},
      common: translations?.common || {}
    };
  }

  /**
   * 取得特定翻譯文本（使用鍵路徑）
   * @param {string} language - 語言代碼
   * @param {string} keyPath - 鍵路徑 (例如: 'workExperience.modal.close')
   * @param {string} fallback - 回退文本
   * @returns {Promise<string>} 翻譯文本
   */
  static async getTranslationByPath(language, keyPath, fallback = keyPath) {
    const translations = await this.loadWorkExperienceTranslations(language);
    return i18nService.getTranslationByPath(translations, keyPath, fallback);
  }

  /**
   * 批量取得工作經歷頁面的所有翻譯文本
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 完整翻譯物件
   */
  static async getAllWorkExperienceTranslations(language) {
    return this.loadWorkExperienceTranslations(language);
  }

  /**
   * 清除工作經歷翻譯快取
   * @param {string} language - 特定語言，如果為空則清除全部
   */
  static clearTranslationCache(language = null) {
    if (language) {
      const cacheKey = `work-experience_${language}`;
      if (this.#translationCache[cacheKey]) {
        delete this.#translationCache[cacheKey];
        console.log(`🗑️ 已清除快取: ${cacheKey}`);
      }
    } else {
      this.#translationCache = {};
      console.log('🗑️ 已清除所有工作經歷翻譯快取');
    }
  }

  /**
   * 獲取翻譯快取統計
   * @returns {Object} 快取統計資訊
   */
  static getTranslationCacheStats() {
    return {
      cachedLanguages: Object.keys(this.#translationCache),
      cacheSize: Object.keys(this.#translationCache).length
    };
  }

  // ============================================
  // 應用初始化相關方法
  // ============================================

  /**
   * 初始化應用狀態（從語言檢測開始）
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 應用狀態
   */
  static async initializeApp(language) {
    try {
      this.#appState.currentLanguage = language;
      
      // 加載工作經歷資料
      const sortedParentExps = await this.initializeAndSortWorkExperiences(language);
      
      // 準備主列表行資料
      const sortedRows = this.prepareMainTableRows(sortedParentExps);
      
      // 加載 UI 翻譯
      const translations = await this.getWorkExperienceUIText(language);
      
      // 構建 parent 資料索引
      const parentExperiences = {};
      sortedParentExps.forEach(exp => {
        parentExperiences[exp.id] = exp;
      });
      
      // 更新應用狀態
      this.#appState.sortedRows = sortedRows;
      this.#appState.parentExperiences = parentExperiences;
      this.#appState.translations = translations;
      
      console.log('✅ 應用狀態初始化完成');
      return this.#appState;
    } catch (error) {
      console.error('❌ 應用初始化失敗:', error.message);
      throw error;
    }
  }

  /**
   * 刷新應用資料（用於語言切換）
   * @param {string} language - 新語言代碼
   * @returns {Promise<Object>} 更新後的應用狀態
   */
  static async refreshAppData(language) {
    // 清除舊語言的翻譯快取
    this.clearTranslationCache(language);
    
    // 重新初始化
    return this.initializeApp(language);
  }

  /**
   * 取得應用狀態
   * @returns {Object} 當前應用狀態
   */
  static getAppState() {
    return { ...this.#appState };
  }

  /**
   * 取得父工作經歷物件（按 ID）
   * @param {string} parentId - Parent ID
   * @returns {Object|null} Parent 工作經歷物件或 null
   */
  static getParentExperienceById(parentId) {
    return this.#appState.parentExperiences[parentId] || null;
  }

  /**
   * 取得所有排序後的表格行
   * @returns {Array} 排序後的行陣列
   */
  static getMainTableRows() {
    return [...this.#appState.sortedRows];
  }

  /**
   * 取得當前語言
   * @returns {string} 語言代碼
   */
  static getCurrentLanguage() {
    return this.#appState.currentLanguage;
  }

  /**
   * 取得所有翻譯
   * @returns {Object} 翻譯物件
   */
  static getTranslations() {
    return { ...this.#appState.translations };
  }

  // ============================================
  // 事件處理方法
  // ============================================

  /**
   * 設置事件回調
   * @param {Object} callbacks - 回調物件
   * @param {Function} callbacks.onLanguageChange - 語言切換回調
   * @param {Function} callbacks.onTableRowClick - 表格行點擊回調
   */
  static setEventCallbacks(callbacks = {}) {
    const { onLanguageChange, onTableRowClick } = callbacks;
    
    if (onLanguageChange) {
      this.#eventCallbacks.onLanguageChange = onLanguageChange;
    }
    if (onTableRowClick) {
      this.#eventCallbacks.onTableRowClick = onTableRowClick;
    }
    
    console.log('✅ 事件回調已設置');
  }

  /**
   * 獲取事件回調
   * @returns {Object} 所有事件回調
   */
  static getEventCallbacks() {
    return {
      onLanguageChange: this.handleLanguageChange.bind(this),
      onTableRowClick: this.handleTableRowClick.bind(this)
    };
  }

  /**
   * 表格行點擊事件處理
   * @param {Object} clickData - 點擊資料
   */
  static handleTableRowClick(clickData) {
    const appState = this.getAppState();
    const { type, id, data } = clickData;

    if (type === 'parent') {
      const parentExp = appState.parentExperiences[id];
      if (parentExp) {
        const childProjects = this.getParentChildProjects(parentExp);
        // 顯示 Parent 模態框，並綁定 child 專案點擊回調
        WorkExperienceModal.showParentModal(
          parentExp,
          childProjects,
          (projectData) => {
            // Child 專案被點擊時，顯示詳情
            WorkExperienceModal.showChildModal(projectData);
          }
        );
      }
    } else if (type === 'child') {
      WorkExperienceModal.showChildModal(data.data);
    }
  }

  /**
   * 語言切換事件處理
   * @param {string} language - 新語言代碼
   * @param {Object} handlers - 外部事件處理器物件
   */
  static async handleLanguageChange(language, handlers = {}) {
    const { 
      LanguageManager, 
      i18nService: i18nServiceRef,
      WorkExperienceTable,
      showLoading,
      showError
    } = handlers;

    console.log(`🌐 語言切換為: ${language}`);
    
    if (showLoading) showLoading(true);
    
    try {
      // 更新 LanguageManager（自動更新 URL 和 localStorage）
      if (LanguageManager) {
        LanguageManager.setLanguage(language);
      }
      
      if (i18nServiceRef) {
        i18nServiceRef.setCurrentLanguage(language);
      }
      
      // 刷新應用資料
      const appState = await this.refreshAppData(language);
      
      // 重新渲染表格
      if (WorkExperienceTable) {
        WorkExperienceTable.initialize({
          containerId: 'work-experience-table',
          rows: appState.sortedRows,
          translations: appState.translations,
          onRowClick: this.handleTableRowClick.bind(this)
        });
      }
      
      if (showLoading) showLoading(false);
    } catch (error) {
      if (showLoading) showLoading(false);
      if (showError) showError('語言切換失敗', error.message);
      console.error('❌ 語言切換錯誤:', error);
    }
  }

  /**
   * 根據 URL 參數中的 ID 自動打開對應的對話框
   * @param {string} id - 要打開的 ID (parent ID 或 child ID)
   * @param {Object} appState - 應用狀態
   */
  static autoOpenModalById(id, appState) {
    if (!id || !appState.parentExperiences) {
      console.warn('⚠️ 無效的 ID 或應用狀態');
      return;
    }

    // 判斷是 parent 還是 child ID
    const isParentId = this.isParentId(id);
    const isChildId = this.isChildId(id);

    if (isParentId) {
      // 打開 Parent 對話框
      const parentExp = appState.parentExperiences[id];
      if (parentExp) {
        const childProjects = this.getParentChildProjects(parentExp);
        WorkExperienceModal.showParentModal(
          parentExp,
          childProjects,
          (projectData) => {
            WorkExperienceModal.showChildModal(projectData);
          }
        );
        console.log(`✅ 自動打開 Parent 對話框: ${id}`);
      } else {
        console.warn(`⚠️ 找不到 ID 為 ${id} 的 Parent 數據`);
      }
    } else if (isChildId) {
      // 打開 Child 對話框
      const parentId = this.extractParentIdFromChildId(id);
      const parentExp = appState.parentExperiences[parentId];
      
      if (parentExp && parentExp.projects) {
        const childProject = parentExp.projects.find(p => p.id === id);
        if (childProject) {
          WorkExperienceModal.showChildModal(childProject);
          console.log(`✅ 自動打開 Child 對話框: ${id}`);
        } else {
          console.warn(`⚠️ 在 Parent ${parentId} 中找不到 Child ID 為 ${id} 的數據`);
        }
      } else {
        console.warn(`⚠️ 找不到 Parent ID 為 ${parentId} 的數據`);
      }
    } else {
      console.warn(`⚠️ 無效的 ID 格式: ${id}`);
    }
  }

  /**
   * 獲取一個簡化的事件處理器物件（用於 HTML 中傳遞）
   * @returns {Object} 事件處理器物件
   */
  static getSimplifiedHandlers() {
    return {
      onTableRowClick: this.handleTableRowClick.bind(this)
    };
  }
}
