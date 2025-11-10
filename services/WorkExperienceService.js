/**
 * Work Experience Service Layer
 * 處理工作經歷資料的業務邏輯：排序、格式化、對話框資料準備等、翻譯管理
 * 也包含事件處理方法
 */

import { WorkExperienceRepository } from '../repositories/WorkExperienceRepository.js';
import { i18nService } from './i18nService.js';
import { LoginService } from './LoginService.js';
import { WorkExperienceModal } from '../components/WorkExperienceModal.js';
import { LanguageManager } from '../i18n/LanguageManager.js';
import { Navigation } from '../components/Navigation.js';
import { WorkExperienceTable } from '../components/WorkExperienceTable.js';
import { LoginComponent } from '../components/LoginComponent.js';

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

  // 加密資料快取（從 WorkExperienceRepository 加載）
  static #encryptedData = null;

  /**
   * 初始化並取得排序後的工作經歷資料
   * 
   * 流程：
   * 1. 從 WorkExperienceRepository 載入資料（可能是加密或明文）
   * 2. 初始化登入元件
   * 3. 優先檢查 Cookie 還原會話 (如失敗 → 顯示登入)
   * 4. 如果成功解密，綁定資料並返回排序後的工作經歷陣列
   * 
   * @param {string} language - 語言代碼
   * @returns {Promise<Array>} 排序後的工作經歷陣列
   */
  static async initializeAndSortWorkExperiences(language = 'zh-TW') {
    try {
      // 1. 從 WorkExperienceRepository 載入資料
      const data = await WorkExperienceRepository.loadWorkExperienceData(language);
      
      // 存儲加密資料供後續使用
      this.#encryptedData = data;
      
      console.log('📥 WorkExperienceRepository 已載入資料');

      // 2. 初始化登入元件
      LoginComponent.initialize({
        containerId: 'loginScreen',
        onLogin: (password) => this.handleLogin(password),
        onCancel: () => console.log('登入取消')
      });

      // 3. 只有加密資料才需要檢查 Cookie
      if (data.encrypted === true) {
        console.log('🔍 偵測到加密資料，先檢查 Cookie...');
        
        // 優先嘗試從 Cookie 還原會話
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          console.log('✅ 會話已還原，資料已自動解密');
          // 綁定資料
          const parentExps = WorkExperienceRepository.getParentWorkExperiences(decryptResult.data);
          await this._bindWorkExperienceData(parentExps);
          return this._sortByPeriodStart(parentExps);
        } else {
          console.log('⚠️ Cookie 無效或已過期，顯示登入畫面');
          // 沒有有效的 Cookie，顯示登入介面
          LoginComponent.show();
          return [];
        }
      } else {
        // 非加密資料，直接使用
        console.log('ℹ️ 非加密資料，直接載入');
        const parentExps = WorkExperienceRepository.getParentWorkExperiences(data);
        await this._bindWorkExperienceData(parentExps);
        return this._sortByPeriodStart(parentExps);
      }
    } catch (error) {
      console.error('❌ 初始化工作經歷資料失敗:', error.message);
      throw error;
    }
  }

  /**
   * 登入按鈕點擊事件處理
   * 使用密碼解密工作經歷資料
   * 
   * @param {string} password - 使用者輸入的密碼
   */
  static async handleLogin(password) {
    try {
      if (!this.#encryptedData) {
        LoginComponent.showError('缺少加密資料，無法登入');
        return;
      }

      console.log('🔐 開始登入流程...');

      // 使用 LoginService 解密資料
      const result = await LoginService.login(password, this.#encryptedData);

      if (result.success) {
        console.log('✅ 登入成功，資料已解密');
        
        // 提取 parent 工作經歷
        const parentExps = WorkExperienceRepository.getParentWorkExperiences(result.data);
        
        // 使用共用方法綁定資料
        await this._bindWorkExperienceData(parentExps);

        console.log('✅ 工作經歷表格已更新');
      } else {
        LoginComponent.showError('❌ 密碼錯誤或資料損壞');
        console.error('❌ 登入失敗:', result.message);
      }
    } catch (error) {
      LoginComponent.showError('❌ 登入失敗: ' + error.message);
      console.error('❌ 登入錯誤:', error);
    }
  }

  /**
   * 共用方法：綁定工作經歷資料到 UI
   * 登入成功或會話還原時都需要執行此方法
   * 
   * @param {Array} parentExps - Parent 工作經歷陣列
   * @private
   */
  static async _bindWorkExperienceData(parentExps) {
    const sortedParentExps = this._sortByPeriodStart(parentExps);

    // 1️⃣ 更新應用狀態
    this.#appState.sortedRows = this.prepareMainTableRows(sortedParentExps);
    this.#appState.parentExperiences = {};
    sortedParentExps.forEach(exp => {
      this.#appState.parentExperiences[exp.id] = exp;
    });

    // 2️⃣ 如果還沒有翻譯，加載翻譯
    if (!this.#appState.translations) {
      const translations = await this.getWorkExperienceUIText(this.#appState.currentLanguage);
      this.#appState.translations = translations;
    }

    // 3️⃣ 隱藏登入介面
    LoginComponent.hide();
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.style.display = 'none !important';
      loginScreen.classList.add('hidden');
    }
    
    // 4️⃣ 顯示主內容和導覽欄
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.style.display = 'block';
    }
    
    const navBar = document.getElementById('navigation');
    if (navBar) {
      navBar.style.display = 'block';
    }

    // 5️⃣ 渲染工作經歷表格
    if (this.#appState.sortedRows.length > 0) {
      WorkExperienceTable.initialize({
        containerId: 'work-experience-table',
        rows: this.#appState.sortedRows,
        translations: this.#appState.translations || {},
        onRowClick: this.handleTableRowClick.bind(this)
      });
    }
  }

  /**
   * 嘗試從 Cookie 還原會話
   * 檢查是否存在有效的認證 Cookie，如果有則自動解密
   * 
   * @returns {Promise<Object>} { success: boolean, data?: Object, message: string }
   */
  static async tryRestoreSession() {
    try {
      if (!this.#encryptedData) {
        return {
          success: false,
          message: '缺少加密資料'
        };
      }

      console.log('🔄 嘗試從 Cookie 還原會話...');

      // 使用 LoginService 從 Cookie 還原會話
      const result = await LoginService.restoreSession(this.#encryptedData);

      if (result.success) {
        console.log('✅ 會話已還原，使用者已認證');
        return {
          success: true,
          data: result.data,
          message: '會話已還原'
        };
      } else {
        console.log('ℹ️ 無有效的會話 Cookie，需要重新登入');
        return {
          success: false,
          message: '無有效會話'
        };
      }
    } catch (error) {
      console.error('❌ 還原會話失敗:', error.message);
      return {
        success: false,
        message: error.message || '會話還原失敗'
      };
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
      common: translations?.common || {}
    };
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


  // ============================================
  // 應用初始化相關方法
  // ============================================

  /**
   * 初始化應用狀態（從語言檢測開始）
   * 
   * 流程：
   * 1. 初始化語言管理器
   * 2. 初始化工作經歷資料和翻譯
   * 3. 初始化 UI 元件（Navigation, Table, Modal）
   * 4. 檢查 URL 參數並自動打開對應的模態框
   * 
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 應用狀態
   */
  static async initializeApp(language) {
    try {
      // 1️⃣ 初始化語言管理器（優先順序：URL > localStorage > 參數 > 預設）
      const detectedLanguage = LanguageManager.initialize();
      const finalLanguage = detectedLanguage || language || 'zh-TW';
      
      i18nService.initialize(finalLanguage);
      this.#appState.currentLanguage = finalLanguage;

      console.log(`🌐 應用語言已設置為: ${finalLanguage}`);

      // 2️⃣ 加載工作經歷資料（支援加密/非加密）
      const sortedParentExps = await this.initializeAndSortWorkExperiences(finalLanguage);
      
      // 3️⃣ 先初始化模態框（無論是否需要登入都需要）
      WorkExperienceModal.initialize({
        containerId: 'modal-container'
      });

      // 4️⃣ 準備主列表行資料
      const sortedRows = this.prepareMainTableRows(sortedParentExps);
      
      // 5️⃣ 加載 UI 翻譯
      const translations = await this.getWorkExperienceUIText(finalLanguage);
      this.#appState.translations = translations;
      
      // 6️⃣ 構建 parent 資料索引
      const parentExperiences = {};
      sortedParentExps.forEach(exp => {
        parentExperiences[exp.id] = exp;
      });
      
      // 7️⃣ 更新應用狀態
      this.#appState.sortedRows = sortedRows;
      this.#appState.parentExperiences = parentExperiences;
      this.#appState.translations = translations;
      
      console.log('✅ 應用狀態初始化完成');

      // 8️⃣ 初始化導覽欄
      Navigation.initialize({
        containerId: 'navigation',
        currentLanguage: finalLanguage,
        onLanguageChange: (lang) => this.handleLanguageChange(lang),
        onLogout: async () => await Navigation.handleLogout('work-experience-table')
      });

      // 9️⃣ 隱藏載入中狀態
      this.showLoading(false);

      // 🔟 渲染工作經歷表格
      if (sortedRows.length > 0) {
        WorkExperienceTable.initialize({
          containerId: 'work-experience-table',
          rows: sortedRows,
          translations: translations,
          onRowClick: this.handleTableRowClick.bind(this)
        });
      }

      console.log('✅ 應用程式初始化完成');

      // 1️⃣1️⃣ 檢查 URL 參數，如果有 ID 則自動打開對應的對話框
      const params = new URLSearchParams(window.location.search);
      const autoOpenId = params.get('id');
      if (autoOpenId) {
        // 延遲執行，確保 DOM 已完全渲染
        setTimeout(() => {
          this.autoOpenModalById(autoOpenId, this.#appState);
        }, 100);
      }

      return this.#appState;
    } catch (error) {
      console.error('❌ 應用初始化失敗:', error.message);
      this.showError('初始化失敗', error.message);
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
 * 顯示/隱藏載入中狀態
 */
  static showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * 顯示錯誤訊息
   */
  static showError(title = '', message = '') {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) return;

    if (!title && !message) {
      errorContainer.innerHTML = '';
      return;
    }

    errorContainer.innerHTML = `
                <div class="error">
                    <div class="error-title">❌ ${title}</div>
                    <div>${message}</div>
                </div>
            `;
  }

  // ============================================
  // 事件處理方法
  // ============================================

  /**
   * 表格行點擊事件處理
   * @param {Object} clickData - 點擊資料
   */
  /**
   * 表格行點擊事件處理
   * @param {Object} clickData - 點擊資料 { type, id, data, index }
   */
  static handleTableRowClick(clickData) {
    const appState = this.getAppState();
    const { type, id, data } = clickData;

    console.log(`🔍 表格行點擊:`, { type, id, data });

    if (type === 'parent') {
      // data 是整個 rowData 物件 { type: 'parent', data: parentExpObject }
      const parentExp = data.data || appState.parentExperiences[id];
      
      if (parentExp) {
        const childProjects = this.getParentChildProjects(parentExp);
        console.log(`📊 顯示 Parent 對話框: ${parentExp.company.name}, 有 ${childProjects.length} 個子專案`);
        
        // 顯示 Parent 模態框（不需要傳遞回調，_bindChildProjectClickEvents 會直接調用 showChildModal）
        WorkExperienceModal.showParentModal(
          parentExp,
          childProjects,
          (projectData) => {
            // Child 專案被點擊時，顯示詳情
            WorkExperienceModal.showChildModal(projectData);
          }
        );
      } else {
        console.warn(`⚠️ 找不到 Parent ID: ${id}`);
      }
    } else if (type === 'child') {
      // data 是整個 rowData 物件 { type: 'child', parentId: ..., data: projectObject }
      const projectData = data.data;
      
      if (projectData) {
        console.log(`📄 顯示 Child 對話框: ${projectData.name}`);
        WorkExperienceModal.showChildModal(projectData);
      } else {
        console.warn(`⚠️ 找不到 Child 專案資料`);
      }
    }
  }

  /**
   * 語言切換事件處理
   * @param {string} language - 新語言代碼
   */
  static async handleLanguageChange(language) {
    console.log(`🌐 語言切換為: ${language}`);
    
    this.showLoading(true);
    
    try {
      // 1. 更新 LanguageManager（自動更新 URL 和 localStorage）
      LanguageManager.setLanguage(language);
      
      // 2. 更新 i18n Service
      i18nService.setCurrentLanguage(language);
      
      // 3. 刷新應用資料
      const appState = await this.refreshAppData(language);
      
      // 4. 重新渲染表格
      if (appState.sortedRows.length > 0) {
        WorkExperienceTable.initialize({
          containerId: 'work-experience-table',
          rows: appState.sortedRows,
          translations: appState.translations,
          onRowClick: this.handleTableRowClick.bind(this)
        });
      }
      
      // 5. 更新導覽欄菜單（Navigation 會自動載入正確的翻譯）
      Navigation.updateMenuByLanguage(language);
      
      this.showLoading(false);
      console.log('✅ 語言切換完成');
    } catch (error) {
      this.showLoading(false);
      this.showError('語言切換失敗', error.message);
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

}
