/**
 * Index Service Layer
 * 處理首頁的業務邏輯：登入、語言管理、資料載入、UI 初始化等
 * 
 * 架構參考 WorkExperienceService，遵循 ServiceRule 設計規則
 * 支援加密和非加密資料格式
 */

import { i18nService } from './i18nService.js';
import { LoginService } from './LoginService.js';
import { LanguageManager } from '../i18n/LanguageManager.js';
import { Navigation } from '../components/Navigation.js';
import { LoginComponent } from '../components/LoginComponent.js';
import { IndexComponent } from '../components/IndexComponent.js';
import { SkillsStatsComponent } from '../components/SkillsStatsComponent.js';
import { SettingsLoader } from '../components/SettingsLoader.js';
import { IndexRepository } from '../repositories/IndexRepository.js';
import { WorkExperienceRepository } from '../repositories/WorkExperienceRepository.js';

export class IndexService {
  //#region 變數宣告
  static #translationCache = {};
  static #appState = {
    currentLanguage: 'zh-TW',
    indexData: null,
    workExperienceData: null,
    skillsStats: null,
    translations: null
  };
  static #encryptedData = null;
  static #encryptedWorkExperienceData = null;
  //#endregion

  //#region 初始化與建構式
  /**
   * 初始化應用狀態（從語言檢測開始）
   * 
   * 流程：
   * 1. 初始化語言管理器（優先順序：URL > localStorage > 參數 > 預設）
   * 2. 載入首頁資料（可能是加密或明文）
   * 3. 初始化登入元件
   * 4. 若資料已加密，檢查 Cookie 會話還原或顯示登入
   * 5. 若資料未加密，直接初始化 UI
   * 
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 應用狀態
   */
  static async initializeApp(language) {
    try {
      // 0️⃣ 載入設定檔
      await SettingsLoader.load();

      // 1️⃣ 初始化語言管理器
      const detectedLanguage = LanguageManager.initialize();
      const finalLanguage = detectedLanguage || language || 'zh-TW';
      
      i18nService.initialize(finalLanguage);
      this.#appState.currentLanguage = finalLanguage;

      // 2️⃣ 載入首頁資料
      this.#encryptedData = await IndexRepository.loadIndexData(finalLanguage);
      
      // 3️⃣ 初始化登入元件
      LoginComponent.initialize({
        containerId: 'loginScreen',
        onLogin: (password) => this.handleLogin(password),
        onCancel: () => {}
      });

      // 4️⃣ 檢查是否有加密資料需要解密
      const hasEncryptedData = this.#encryptedData.encrypted === true;

      if (hasEncryptedData) {
        // 優先從 Cookie 還原會話
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          // Cookie 有效，直接使用解密後的資料
          this.#appState.indexData = decryptResult.data;
          await this._initializeUI();
          return this.#appState;
        } else {
          // 沒有有效的 Cookie，顯示登入畫面
          LoginComponent.show();
          return this.#appState;
        }
      } else {
        // 非加密資料，直接使用
        this.#appState.indexData = this.#encryptedData;
        await this._initializeUI();
        return this.#appState;
      }
    } catch (error) {
      console.error('❌ 應用初始化失敗:', error.message);
      throw error;
    }
  }
  //#endregion

  //#region 使用方法
  /**
   * 取得應用狀態
   * @returns {Object} 當前應用狀態副本
   */
  static getAppState() {
    return { ...this.#appState };
  }

  /**
   * 取得當前語言
   * @returns {string} 語言代碼
   */
  static getCurrentLanguage() {
    return this.#appState.currentLanguage;
  }

  /**
   * 取得翻譯資料
   * @returns {Object} 翻譯物件
   */
  static getTranslations() {
    return this.#appState.translations || {};
  }

  /**
   * 取得首頁內容資料
   * @returns {Object} 首頁資料
   */
  static getIndexData() {
    return this.#appState.indexData;
  }

  /**
   * 取得技能統計資料
   * @returns {Object} 技能統計資料
   */
  static getSkillsStats() {
    return this.#appState.skillsStats;
  }
  //#endregion

  //#region UI 相關方法
  /**
   * 初始化 UI
   * 隱藏登入畫面、初始化導覽、初始化首頁元件等
   * 
   * @private
   * @returns {Promise<Object>} 應用狀態
   */
  static async _initializeUI() {
    try {
      // 1️⃣ 隱藏登入畫面
      LoginComponent.hide();
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) {
        loginScreen.style.display = 'none !important';
        loginScreen.classList.add('hidden');
      }

      // 2️⃣ 載入翻譯
      const translations = await this._loadIndexTranslations(this.#appState.currentLanguage);
      this.#appState.translations = translations;

      // 3️⃣ 初始化導覽欄
      await Navigation.initialize({
        containerId: 'navigation',
        currentLanguage: this.#appState.currentLanguage,
        onLanguageChange: (lang) => this.handleLanguageChange(lang),
        onLogout: () => this.handleLogout()
      });

      // 4️⃣ 初始化首頁元件
      await IndexComponent.initialize({
        containerId: 'contentArea',
        data: this.#appState.indexData,
        translations: translations
      });

      // 5️⃣ 載入工作經歷資料並計算技能統計
      await this._loadAndDisplaySkillsStats();

      // 6️⃣ 顯示主要內容和導覽欄
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.classList.remove('hidden');
      }

      const navBar = document.getElementById('navigation');
      if (navBar) {
        navBar.style.display = 'block';
      }

      console.log('✅ UI 初始化完成');
      return this.#appState;
    } catch (error) {
      console.error('❌ UI 初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 載入工作經歷資料並顯示技能統計
   * 
   * @private
   * @returns {Promise<void>}
   */
  static async _loadAndDisplaySkillsStats() {
    try {
      // 檢查設定檔是否啟用技能統計顯示
      if (!SettingsLoader.get('features.showSkillsStats', true)) {
        console.log('📊 技能統計已在設定中停用');
        return;
      }

      // 載入工作經歷資料
      const workExpData = await WorkExperienceRepository.loadWorkExperienceData(this.#appState.currentLanguage);
      
      // 檢查是否加密
      if (workExpData.encrypted === true) {
        this.#encryptedWorkExperienceData = workExpData;
        
        // 嘗試從 Cookie 還原會話解密
        const decryptResult = await this._tryDecryptWorkExperienceData();
        
        if (decryptResult.success) {
          this.#appState.workExperienceData = decryptResult.data;
        } else {
          console.log('📊 工作經歷資料需要登入後才能顯示技能統計');
          return;
        }
      } else {
        this.#appState.workExperienceData = workExpData;
      }

      // 計算技能統計
      const skillsStats = WorkExperienceRepository.getAllProjectTagsStats(this.#appState.workExperienceData);
      this.#appState.skillsStats = skillsStats;

      // 初始化技能統計元件
      if (skillsStats && skillsStats.skills && skillsStats.skills.length > 0) {
        await SkillsStatsComponent.initialize({
          containerId: 'skills-stats-container',
          skillsData: skillsStats,
          translations: this.#appState.translations
        });
        console.log('📊 技能統計載入完成');
      }
    } catch (error) {
      console.error('❌ 載入技能統計失敗:', error.message);
      // 不阻擋主頁面載入
    }
  }

  /**
   * 嘗試解密工作經歷資料
   * 
   * @private
   * @returns {Promise<Object>} { success: boolean, data?: Object }
   */
  static async _tryDecryptWorkExperienceData() {
    try {
      if (!this.#encryptedWorkExperienceData) {
        return { success: false, message: '缺少加密資料' };
      }

      const result = await LoginService.restoreSession(this.#encryptedWorkExperienceData);
      
      if (result.success) {
        return { success: true, data: result.data };
      }
      
      return { success: false, message: '無有效會話' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 加載首頁翻譯資料
   * 
   * @private
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 首頁翻譯物件
   */
  static async _loadIndexTranslations(language) {
    try {
      const cacheKey = `index_${language}`;

      // 檢查本地快取
      if (this.#translationCache[cacheKey]) {
        return this.#translationCache[cacheKey];
      }

      // 從 i18nService 加載翻譯
      const translations = await i18nService.loadModuleTranslations('index', language);

      // 快取翻譯資料
      this.#translationCache[cacheKey] = translations;

      return translations;
    } catch (error) {
      console.error('❌ 加載翻譯失敗:', error.message);
      throw error;
    }
  }

  /**
   * 清除首頁翻譯快取
   * 
   * @param {string} language - 特定語言，如果為空則清除全部
   */
  static clearTranslationCache(language = null) {
    if (language) {
      const cacheKey = `index_${language}`;
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
   * 登入事件處理
   * 使用密碼解密資料
   * 
   * @param {string} password - 使用者輸入的密碼
   */
  static async handleLogin(password) {
    try {
      if (!this.#encryptedData) {
        LoginComponent.showError('❌ 缺少加密資料，無法登入');
        return;
      }

      // 使用 LoginService 解密資料
      const result = await LoginService.login(password, this.#encryptedData);

      if (result.success) {
        // 更新應用狀態
        this.#appState.indexData = result.data;
        
        // 初始化 UI
        await this._initializeUI();
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
   * 語言切換事件處理
   * 
   * 流程：
   * 1. 載入新語言的資料檔案
   * 2. 如果是加密資料，從 Cookie 重新解密
   * 3. 如果解密失敗，顯示登入畫面
   * 4. 更新翻譯和 UI
   * 
   * @param {string} language - 新語言代碼
   */
  static async handleLanguageChange(language) {
    try {
      // 1️⃣ 更新語言管理器和 i18n 服務
      LanguageManager.setLanguage(language);
      i18nService.setCurrentLanguage(language);
      this.#appState.currentLanguage = language;

      // 2️⃣ 載入新語言的資料
      this.#encryptedData = await IndexRepository.loadIndexData(language);
      
      // 3️⃣ 檢查是否有加密資料需要重新解密
      const hasEncryptedData = this.#encryptedData.encrypted === true;

      if (hasEncryptedData) {
        // 嘗試從 Cookie 還原會話並用新語言的加密資料重新解密
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          // 解密成功，更新資料
          this.#appState.indexData = decryptResult.data;
        } else {
          // 解密失敗，需要重新登入
          this.clearTranslationCache();
          i18nService.initialize(language);
          
          LoginComponent.initialize({
            containerId: 'loginScreen',
            onLogin: (password) => this.handleLogin(password),
            onCancel: () => {}
          });
          LoginComponent.show();
          return;
        }
      } else {
        // 非加密資料，直接使用
        this.#appState.indexData = this.#encryptedData;
      }

      // 4️⃣ 重新載入翻譯
      this.clearTranslationCache();
      const translations = await this._loadIndexTranslations(language);
      this.#appState.translations = translations;

      // 5️⃣ 更新首頁內容
      await IndexComponent.updateLanguage(language, this.#appState.indexData, translations);

      // 6️⃣ 更新技能統計
      await this._loadAndDisplaySkillsStats();

      // 7️⃣ 更新導覽欄菜單
      Navigation.updateMenuByLanguage(language);

      console.log(`🌐 語言已切換至: ${language}`);
    } catch (error) {
      console.error('❌ 語言切換失敗:', error);
    }
  }

  /**
   * 登出事件處理
   */
  static async handleLogout() {
    try {
      // 清除會話和 Cookie
      LoginService.logout();

      // 重置資料
      this.#appState.indexData = null;

      // 隱藏主要內容
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.style.display = 'none';
        mainContent.classList.add('hidden');
      }

      const navBar = document.getElementById('navigation');
      if (navBar) {
        navBar.style.display = 'none';
      }

      // 清除 DOM 元素
      const table = document.getElementById('contentArea');
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

      console.log('✅ 已登出');
    } catch (error) {
      console.error('❌ 登出失敗:', error);
    }
  }
  //#endregion

  //#region 共用方法
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

      // 使用 LoginService 從 Cookie 還原會話
      const result = await LoginService.restoreSession(this.#encryptedData);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: '會話已還原'
        };
      } else {
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
  //#endregion
}
