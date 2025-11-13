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
import { LoadingAndErrorComponent } from '../components/LoadingAndErrorComponent.js';

export class WorkExperienceService {
  //#region 變數宣告
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
  //#endregion

  //#region 初始化與建構式
  /**
   * 初始化應用狀態（完全對齊 ResumeService 的流程）
   * 
   * 流程：
   * 1. 初始化語言管理器
   * 2. 載入工作經歷資料
   * 3. 快取資料（區分加密/非加密）
   * 4. 初始化登入元件
   * 5. 檢查加密資料，嘗試還原會話或顯示登入
   * 6. 初始化 UI（Navigation, Modal, Table）
   * 7. 檢查 URL 參數並自動打開對應的模態框
   * 
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 應用狀態
   */
  static async initializeApp(language = 'zh-TW') {
    try {
      // 1️⃣ 初始化語言管理器（優先順序：URL > localStorage > 參數 > 預設）
      const detectedLanguage = LanguageManager.initialize();
      const finalLanguage = detectedLanguage || language || 'zh-TW';
      this.#appState.currentLanguage = finalLanguage;
      i18nService.initialize(finalLanguage);

      // 2️⃣ 載入工作經歷資料
      const data = await WorkExperienceRepository.loadWorkExperienceData(finalLanguage);

      // 3️⃣ 快取資料（區分加密/非加密）
      if (data.encrypted === true) {
        this.#encryptedData = data;
      } else {
        this.#encryptedData = null;
      }

      // 4️⃣ 初始化登入元件
      LoginComponent.initialize({
        containerId: 'loginScreen',
        onLogin: (password) => this.handleLogin(password),
        onCancel: () => { }
      });

      // 5️⃣ 檢查是否有加密資料需要解密
      const hasEncryptedData = this.#encryptedData !== null;

      if (hasEncryptedData) {
        // 優先從 Cookie 還原會話
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          const parentExps = WorkExperienceRepository.getParentWorkExperiences(decryptResult.data);
          return await this._initializeUI(parentExps);
        } else {
          LoginComponent.show();
          return this.#appState;
        }
      } else {
        // 非加密資料，直接使用
        const parentExps = WorkExperienceRepository.getParentWorkExperiences(data);
        return await this._initializeUI(parentExps);
      }
    } catch (error) {
      console.error('❌ 應用初始化失敗:', error.message);
      LoadingAndErrorComponent.showError('初始化失敗', error.message);
      throw error;
    }
  }
  //#endregion

  //#region 使用方法
  /**
   * 取得應用狀態
   * @returns {Object} 當前應用狀態
   */
  static getAppState() {
    return { ...this.#appState };
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
  //#endregion

  //#region UI 相關方法
  /**
   * 初始化 UI(完全對齊 ResumeService._initializeUI 的流程)
   * @param {Array} parentExps - Parent 工作經歷陣列
   * @returns {Promise<Object>} 應用狀態
   * @private
   */
  static async _initializeUI(parentExps) {
    try {
      // 1️⃣ 隱藏登入畫面
      LoginComponent.hide();
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) {
        loginScreen.style.display = 'none !important';
        loginScreen.classList.add('hidden');
      }

      // 2️⃣ 載入翻譯
      const translations = await this.getWorkExperienceUIText(this.#appState.currentLanguage);
      this.#appState.translations = translations;

      // 3️⃣ 更新應用狀態
      this._updateAppStateWithDecryptedData(parentExps);

      // 4️⃣ 初始化模態框
      WorkExperienceModal.initialize({
        containerId: 'modal-container'
      });

      // 5️⃣ 初始化導覽欄
      await Navigation.initialize({
        containerId: 'navigation',
        currentLanguage: this.#appState.currentLanguage,
        onLanguageChange: (lang) => this.handleLanguageChange(lang),
        onLogout: () => this.handleLogout()
      });

      // 6️⃣ 顯示主內容和導覽欄
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.style.display = 'block';
      }

      const navBar = document.getElementById('navigation');
      if (navBar) {
        navBar.style.display = 'block';
      }

      // 7️⃣ 隱藏載入中狀態
      LoadingAndErrorComponent.hideLoading();

      // 8️⃣ 渲染工作經歷表格
      this._renderWorkExperienceTable();

      // 9️⃣ 檢查 URL 參數，如果有 ID 則自動打開對應的對話框
      const params = new URLSearchParams(window.location.search);
      const autoOpenId = params.get('id');
      if (autoOpenId) {
        setTimeout(() => {
          this.autoOpenModalById(autoOpenId, this.#appState);
        }, 100);
      }

      return this.#appState;
    } catch (error) {
      console.error('❌ UI 初始化失敗:', error);
      LoadingAndErrorComponent.showError('初始化失敗: ' + error.message);
      throw error;
    }
  }

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
      }
    } else {
      this.#translationCache = {};
    }
  }
  //#endregion

  //#region 事件處理方法
  /**
   * 登入按鈕點擊事件處理
   * @param {string} password - 使用者輸入的密碼
   */
  static async handleLogin(password) {
    try {
      const decryptResult = await this._decryptSingleData(
        LoginService.login.bind(LoginService),
        password
      );

      if (!decryptResult.success) {
        LoginComponent.showError('❌ ' + decryptResult.message);
        console.error('❌ 登入失敗:', decryptResult.message);
        return;
      }

      const parentExps = WorkExperienceRepository.getParentWorkExperiences(decryptResult.data);
      await this._initializeUI(parentExps);
    } catch (error) {
      LoginComponent.showError('❌ 登入失敗: ' + error.message);
      console.error('❌ 登入錯誤:', error);
    }
  }

  /**
   * 表格行點擊事件處理
   * @param {Object} clickData - 點擊資料 { type, id, data, index }
   */
  static handleTableRowClick(clickData) {
    const appState = this.getAppState();
    const { type, id, data } = clickData;

    if (type === 'parent') {
      // data 是整個 rowData 物件 { type: 'parent', data: parentExpObject }
      const parentExp = data.data || appState.parentExperiences[id];

      if (parentExp) {
        const childProjects = this.getParentChildProjects(parentExp);

        // 顯示 Parent 模態框（不需要傳遞回調，_bindChildProjectClickEvents 會直接調用 showChildModal）
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
      // data 是整個 rowData 物件 { type: 'child', parentId: ..., data: projectObject }
      const projectData = data.data;

      if (projectData) {
        WorkExperienceModal.showChildModal(projectData);
      }
    }
  }

  /**
   * 登出事件處理
   */
  static async handleLogout() {
    try {
      // 清除會話和 Cookie
      LoginService.logout();

      // 重置應用狀態為加密資料
      this.#appState.sortedRows = [];
      this.#appState.parentExperiences = {};

      // 隱藏主要內容
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.style.display = 'none';
        mainContent.classList.add('hidden');
      }

      const navBar = document.getElementById('navigation');
      if (navBar) {
        navBar.style.display = 'none';
        navBar.classList.add('hidden');
      }

      // 清除 DOM 元素
      const table = document.getElementById('work-experience-table');
      if (table) {
        table.innerHTML = '';
      }

      // 初始化登入元件
      LoginComponent.initialize({
        containerId: 'loginScreen',
        onLogin: (password) => this.handleLogin(password),
        onCancel: () => { }
      });
      LoginComponent.show();
    } catch (error) {
      console.error('❌ 登出失敗:', error);
    }
  }

  /**
   * 語言切換事件處理
   * @param {string} language - 新語言代碼
   */
  static async handleLanguageChange(language) {
    try {
      this.#appState.currentLanguage = language;

      // 清除翻譯快取並初始化新語言的 i18n
      this.clearTranslationCache(language);
      i18nService.initialize(language);

      // 重新載入工作經歷資料
      const data = await WorkExperienceRepository.loadWorkExperienceData(language);

      // 快取新語言的資料（區分加密/非加密）
      if (data.encrypted === true) {
        this.#encryptedData = data;
      } else {
        this.#encryptedData = null;
      }

      // 檢查是否有加密資料需要重新解密
      const hasEncryptedData = this.#encryptedData !== null;

      if (hasEncryptedData) {
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          const parentExps = WorkExperienceRepository.getParentWorkExperiences(decryptResult.data);
          this._updateAppStateWithDecryptedData(parentExps);
        } else {
          // 需要重新登入
          LoginComponent.initialize({
            containerId: 'loginScreen',
            onLogin: (password) => this.handleLogin(password),
            onCancel: () => { }
          });
          LoginComponent.show();
          return;
        }
      } else {
        // 非加密資料
        const parentExps = WorkExperienceRepository.getParentWorkExperiences(data);
        this._updateAppStateWithDecryptedData(parentExps);
      }

      // 重新載入翻譯並更新表格
      const translations = await this.getWorkExperienceUIText(language);
      this.#appState.translations = translations;

      // 重新渲染表格
      this._renderWorkExperienceTable();

      // 更新 URL（不刷新頁面）
      const url = new URL(window.location);
      url.searchParams.set('lang', language);
      window.history.replaceState({}, '', url);
    } catch (error) {
      console.error('❌ 語言切換失敗:', error);
    }
  }

  /**
   * 根據 URL 參數中的 ID 自動打開對應的對話框
   * @param {string} id - 要打開的 ID (parent ID 或 child ID)
   * @param {Object} appState - 應用狀態
   */
  static autoOpenModalById(id, appState) {
    if (!id || !appState.parentExperiences) {
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
      }
    } else if (isChildId) {
      // 打開 Child 對話框
      const parentId = this.extractParentIdFromChildId(id);
      const parentExp = appState.parentExperiences[parentId];

      if (parentExp && parentExp.projects) {
        const childProject = parentExp.projects.find(p => p.id === id);
        if (childProject) {
          WorkExperienceModal.showChildModal(childProject);
        }
      }
    }
  }
  //#endregion

  //#region 共用方法
  /**
   * 解密單一資料源（工作經歷）
   * @param {Function} decryptFn - 解密函數
   * @param {string|null} password - 密碼
   * @returns {Promise<{success: boolean, data: Object|null, message: string}>}
   */
  static async _decryptSingleData(decryptFn, password = null) {
    if (!this.#encryptedData) {
      return {
        success: false,
        data: null,
        message: '缺少加密資料'
      };
    }

    try {
      const result = password
        ? await decryptFn(password, this.#encryptedData)
        : await decryptFn(this.#encryptedData);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: '解密成功'
        };
      } else {
        return {
          success: false,
          data: null,
          message: result.message || '解密失敗'
        };
      }
    } catch (error) {
      console.error('❌ 解密錯誤:', error.message);
      return {
        success: false,
        data: null,
        message: error.message || '解密異常'
      };
    }
  }

  /**
   * 嘗試從 Cookie 還原會話
   * @returns {Promise<Object>}
   */
  static async tryRestoreSession() {
    try {
      const decryptResult = await this._decryptSingleData(
        LoginService.restoreSession.bind(LoginService)
      );

      if (decryptResult.success) {
        return {
          success: true,
          data: decryptResult.data,
          message: '會話已還原'
        };
      } else {
        return {
          success: false,
          message: decryptResult.message || '無有效會話'
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
   * 用解密後的資料更新應用狀態
   * @param {Array} parentExps - Parent 工作經歷陣列
   */
  static _updateAppStateWithDecryptedData(parentExps) {
    const sortedParentExps = this._sortByPeriodStart(parentExps);

    this.#appState.sortedRows = this.prepareMainTableRows(sortedParentExps);
    this.#appState.parentExperiences = {};
    sortedParentExps.forEach(exp => {
      this.#appState.parentExperiences[exp.id] = exp;
    });
  }

  /**
   * 渲染工作經歷表格
   */
  static _renderWorkExperienceTable() {
    if (this.#appState.sortedRows.length > 0) {
      WorkExperienceTable.initialize({
        containerId: 'work-experience-table',
        rows: this.#appState.sortedRows,
        translations: this.#appState.translations,
        onRowClick: this.handleTableRowClick.bind(this)
      });
    }
  }
  //#endregion

  //#region 私有方法
  /**
   * 按期間開始時間排序工作經歷（近的在上）
   * @param {Array} experiences - 工作經歷陣列
   * @returns {Array} 排序後的陣列
   */
  static _sortByPeriodStart(experiences) {
    return [...experiences].sort((a, b) => {
      const dateA = this._parsePeriodDate(a.period.start);
      const dateB = this._parsePeriodDate(b.period.start);
      return dateB - dateA;
    });
  }

  /**
   * 解析期間日期字串
   * @param {string} dateStr - 日期字串
   * @returns {number} 可比較的數值
   */
  static _parsePeriodDate(dateStr) {
    const [year, month] = dateStr.split('.');
    return parseInt(year + (month.padStart(2, '0') + '00'));
  }

  /**
   * 按結束日期排序專案（最近的在上）
   * @param {Array} projects - 專案陣列
   * @returns {Array} 排序後的專案陣列
   */
  static _sortProjectsByEndDate(projects) {
    return [...projects].sort((a, b) => {
      const endDateA = this._getLatestEndDate(a.periods);
      const endDateB = this._getLatestEndDate(b.periods);

      const numA = this._parsePeriodDate(endDateA);
      const numB = this._parsePeriodDate(endDateB);

      return numB - numA;
    });
  }

  /**
   * 取得最近的結束日期
   * @param {Array} periods - 期間陣列
   * @returns {string} 最後一個 end 日期
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
  //#endregion
}
