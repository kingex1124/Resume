/**
 * Resume Service Layer
 * 處理履歷資料的業務邏輯：資料整合、翻譯管理、事件處理等
 */

import { ProfileRepository } from '../repositories/ProfileRepository.js';
import { PortfolioRepository } from '../repositories/PortfolioRepository.js';
import { WorkExperienceRepository } from '../repositories/WorkExperienceRepository.js';
import { i18nService } from './i18nService.js';
import { LoginService } from './LoginService.js';
import { LanguageManager } from '../i18n/LanguageManager.js';
import { Navigation } from '../components/Navigation.js';
import { LoginComponent } from '../components/LoginComponent.js';
import { LoadingAndErrorComponent } from '../components/LoadingAndErrorComponent.js';

export class ResumeService {
  // 快取翻譯資料
  static #translationCache = {};

  // 應用狀態
  static #appState = {
    currentLanguage: 'zh-TW',
    profileData: null,
    portfolioData: null,
    workExperienceData: null,
    translations: null
  };

  // 加密資料快取
  static #encryptedWorkExperienceData = null;
  static #encryptedProfileData = null;
  static #encryptedPortfolioData = null;

  // ============================================
  // 共用私有方法
  // ============================================

  /**
   * 解密多個資料源（共用方法）
   * @param {Function} decryptFn - 解密函數 (LoginService.login 或 LoginService.restoreSession)
   * @param {string|null} password - 密碼（restoreSession 時為 null）
   * @returns {Promise<{success: boolean, data: Object, failedCount: number}>}
   * @private
   */
  static async _decryptMultipleData(decryptFn, password = null) {
    const decryptedData = {};
    let successCount = 0;
    let totalEncrypted = 0;
    const errors = [];

    // 嘗試解密 profile 資料
    if (this.#encryptedProfileData) {
      totalEncrypted++;
      try {
        const result = password
          ? await decryptFn(password, this.#encryptedProfileData)
          : await decryptFn(this.#encryptedProfileData);
        if (result.success) {
          decryptedData.profile = result.data;
          successCount++;
        } else {
          errors.push(`Profile: ${result.message}`);
        }
      } catch (error) {
        errors.push(`Profile: ${error.message}`);
      }
    }

    // 嘗試解密 portfolio 資料
    if (this.#encryptedPortfolioData) {
      totalEncrypted++;
      try {
        const result = password
          ? await decryptFn(password, this.#encryptedPortfolioData)
          : await decryptFn(this.#encryptedPortfolioData);
        if (result.success) {
          decryptedData.portfolio = result.data;
          successCount++;
        } else {
          errors.push(`Portfolio: ${result.message}`);
        }
      } catch (error) {
        errors.push(`Portfolio: ${error.message}`);
      }
    }

    // 嘗試解密 workExperience 資料
    if (this.#encryptedWorkExperienceData) {
      totalEncrypted++;
      try {
        const result = password
          ? await decryptFn(password, this.#encryptedWorkExperienceData)
          : await decryptFn(this.#encryptedWorkExperienceData);
        if (result.success) {
          decryptedData.workExperience = result.data;
          successCount++;
        } else {
          errors.push(`WorkExperience: ${result.message}`);
        }
      } catch (error) {
        errors.push(`WorkExperience: ${error.message}`);
      }
    }

    return {
      success: successCount === totalEncrypted && totalEncrypted > 0,
      data: decryptedData,
      failedCount: totalEncrypted - successCount,
      errors: errors,
      totalEncrypted: totalEncrypted
    };
  }

  /**
   * 初始化履歷資料
   * 
   * 流程：
   * 1. 初始化語言管理器
   * 2. 並行載入 Profile、Portfolio、WorkExperience 資料
   * 3. 快取加密資料
   * 4. 如果有加密資料，嘗試從 Cookie 還原會話，失敗則顯示登入
   * 5. 初始化 UI
   * 
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 應用狀態物件
   */
  static async initializeApp(language = 'zh-TW') {
    try {
      // 1️⃣ 初始化語言管理器（優先順序：URL > localStorage > 參數 > 預設）
      const detectedLanguage = LanguageManager.initialize();
      const finalLanguage = detectedLanguage || language || 'zh-TW';
      this.#appState.currentLanguage = finalLanguage;
      i18nService.initialize(finalLanguage);

      // 2️⃣ 並行載入三種資料
      const [profileData, portfolioData, workExpData] = await Promise.all([
        ProfileRepository.loadProfileData(finalLanguage),
        PortfolioRepository.loadPortfolioData(finalLanguage),
        WorkExperienceRepository.loadWorkExperienceData(finalLanguage)
      ]);

      // 3️⃣ 快取資料（區分加密/非加密）
      this._cacheLoadedData(profileData, portfolioData, workExpData);

      // 4️⃣ 初始化登入元件
      LoginComponent.initialize({
        containerId: 'loginScreen',
        onLogin: (password) => this.handleLogin(password),
        onCancel: () => { }
      });

      // 5️⃣ 檢查是否有加密資料需要解密
      const hasEncryptedData = this.#encryptedProfileData ||
        this.#encryptedPortfolioData ||
        this.#encryptedWorkExperienceData;

      if (hasEncryptedData) {
        // 優先從 Cookie 還原會話
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          this._updateAppStateWithDecryptedData(decryptResult.data);
          return await this._initializeUI();
        } else {
          LoginComponent.show();
          return this.#appState;
        }
      } else {
        // 非加密，直接初始化 UI
        return await this._initializeUI();
      }
    } catch (error) {
      console.error('❌ 初始化失敗:', error.message);
      console.error('詳細錯誤:', error);
      throw error;
    }
  }

  /**
   * 快取載入的資料（區分加密/非加密）
   * @param {Object} profileData - Profile 資料
   * @param {Object} portfolioData - Portfolio 資料
   * @param {Object} workExpData - WorkExperience 資料
   * @private
   */
  static _cacheLoadedData(profileData, portfolioData, workExpData) {
    // 快取加密資料
    if (profileData.encrypted === true) {
      this.#encryptedProfileData = profileData;
    } else {
      this.#appState.profileData = profileData;
      this.#encryptedProfileData = null;
    }

    if (portfolioData.encrypted === true) {
      this.#encryptedPortfolioData = portfolioData;
    } else {
      this.#appState.portfolioData = portfolioData;
      this.#encryptedPortfolioData = null;
    }

    if (workExpData.encrypted === true) {
      this.#encryptedWorkExperienceData = workExpData;
    } else {
      this.#appState.workExperienceData = workExpData;
      this.#encryptedWorkExperienceData = null;
    }
  }

  /**
   * 用解密後的資料更新應用狀態
   * @param {Object} decryptedData - 解密後的資料 { profile?, portfolio?, workExperience? }
   * @private
   */
  static _updateAppStateWithDecryptedData(decryptedData) {
    if (decryptedData.profile) {
      this.#appState.profileData = decryptedData.profile;
    }
    if (decryptedData.portfolio) {
      this.#appState.portfolioData = decryptedData.portfolio;
    }
    if (decryptedData.workExperience) {
      this.#appState.workExperienceData = decryptedData.workExperience;
    }
  }

  /**
   * 登入事件處理
   * @param {string} password - 使用者輸入的密碼
   */
  static async handleLogin(password) {
    try {
      // 使用共用方法解密所有加密資料
      const decryptResult = await this._decryptMultipleData(
        LoginService.login.bind(LoginService),
        password
      );

      if (!decryptResult.success) {
        const errorMsg = decryptResult.errors.length > 0
          ? decryptResult.errors.join('; ')
          : '解密失敗';
        throw new Error(errorMsg);
      }

      // 更新應用狀態
      this._updateAppStateWithDecryptedData(decryptResult.data);

      // 初始化 UI
      await this._initializeUI();

      // 重繪頁面
      await this._renderPage();
    } catch (error) {
      LoginComponent.showError('登入失敗: ' + error.message);
      console.error('❌ 登入錯誤:', error);
    }
  }

  /**
   * 嘗試從 Cookie 還原會話
   * @returns {Promise<Object>}
   */
  static async tryRestoreSession() {
    try {
      // 使用共用方法從 Cookie 還原所有加密資料
      const decryptResult = await this._decryptMultipleData(
        LoginService.restoreSession.bind(LoginService)
      );

      if (decryptResult.success) {
        return { success: true, data: decryptResult.data };
      } else {
        return { success: false, message: '無有效會話' };
      }
    } catch (error) {
      console.error('❌ 還原會話失敗:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * 初始化 UI
   * @private
   */
  static async _initializeUI() {
    try {
      // 隱藏登入畫面
      LoginComponent.hide();
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) {
        loginScreen.style.display = 'none !important';
        loginScreen.classList.add('hidden');
      }

      // 載入翻譯
      const translations = await this.getResumeTranslations(this.#appState.currentLanguage);
      this.#appState.translations = translations;

      // 初始化導覽（提供回調函數）
      await Navigation.initialize({
        containerId: 'navigation',
        currentLanguage: this.#appState.currentLanguage,
        onLanguageChange: (lang) => this.handleLanguageChange(lang),
        onLogout: () => this.handleLogout()
      });

      // 顯示內容
      const mainContent = document.getElementById('resume-container');
      if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.classList.remove('hidden');
      }

      return this.#appState;
    } catch (error) {
      console.error('❌ UI 初始化失敗:', error);
      LoadingAndErrorComponent.showError('loading-error-container', '初始化失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 重繪頁面（避免重複代碼）
   * @private
   */
  static async _renderPage() {
    try {
      const ResumeApp = (await import('../components/ResumeApp.js')).default;
      const app = new ResumeApp();
      app.renderPage();
    } catch (err) {
      console.error('❌ 無法重繪頁面:', err);
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

      // 並行重新載入資料
      const [profileData, portfolioData, workExpData] = await Promise.all([
        ProfileRepository.loadProfileData(language),
        PortfolioRepository.loadPortfolioData(language),
        WorkExperienceRepository.loadWorkExperienceData(language)
      ]);

      // 快取新語言的資料（區分加密/非加密）
      this._cacheLoadedData(profileData, portfolioData, workExpData);

      // 檢查是否有加密資料需要重新解密
      const hasEncryptedData = this.#encryptedProfileData ||
        this.#encryptedPortfolioData ||
        this.#encryptedWorkExperienceData;

      if (hasEncryptedData) {
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          this._updateAppStateWithDecryptedData(decryptResult.data);
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
        // 非加密，直接更新應用狀態
        this.#appState.profileData = profileData;
        this.#appState.portfolioData = portfolioData;
        this.#appState.workExperienceData = workExpData;
      }

      // 重新載入翻譯並更新頁面
      const translations = await this.getResumeTranslations(language);
      this.#appState.translations = translations;

      // 重繪頁面
      await this._renderPage();

      // 更新 URL（不刷新頁面）
      const url = new URL(window.location);
      url.searchParams.set('lang', language);
      window.history.replaceState({}, '', url);
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

      // 重置應用狀態為加密資料
      this.#appState.profileData = this.#encryptedProfileData || null;
      this.#appState.portfolioData = this.#encryptedPortfolioData || null;
      this.#appState.workExperienceData = this.#encryptedWorkExperienceData || null;

      // 隱藏主要內容
      const mainContent = document.getElementById('resume-container');
      if (mainContent) {
        mainContent.style.display = 'none';
        mainContent.classList.add('hidden');
      }

      // 清除 DOM 元素
      const app = document.getElementById('resume-app');
      if (app) {
        app.innerHTML = '';
      }

      // 顯示登入畫面
      LoginComponent.show();
    } catch (error) {
      console.error('❌ 登出失敗:', error);
    }
  }

  /**
   * 載入並快取履歷翻譯
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>}
   */
  static async getResumeTranslations(language) {
    const cacheKey = `resume_${language}`;
    if (this.#translationCache[cacheKey]) {
      return this.#translationCache[cacheKey];
    }

    try {
      const translations = await i18nService.loadModuleTranslations('resume', language);
      this.#translationCache[cacheKey] = translations;
      return translations;
    } catch (error) {
      console.error('❌ 載入翻譯失敗:', error);
      return {};
    }
  }

  /**
   * 清除特定語言的翻譯快取
   * @param {string} language - 語言代碼
   */
  static clearTranslationCache(language) {
    const cacheKey = `resume_${language}`;
    if (this.#translationCache[cacheKey]) {
      delete this.#translationCache[cacheKey];
    }
  }

  /**
   * 取得應用狀態
   * @returns {Object}
   */
  static getAppState() {
    return { ...this.#appState };
  }

  /**
   * 取得個人資訊
   * @returns {Object}
   */
  static getProfile() {
    if (!this.#appState.profileData) return null;
    return ProfileRepository.getProfile(this.#appState.profileData);
  }

  /**
   * 取得資訊連結
   * @returns {Array}
   */
  static getInfoLinks() {
    if (!this.#appState.profileData) return [];
    return ProfileRepository.getInfoLinks(this.#appState.profileData);
  }

  /**
   * 取得教育背景
   * @returns {Array}
   */
  static getEducation() {
    if (!this.#appState.profileData) return [];
    return ProfileRepository.getEducation(this.#appState.profileData);
  }

  /**
   * 取得專業技能
   * @returns {Array}
   */
  static getSkills() {
    if (!this.#appState.profileData) return [];
    return ProfileRepository.getSkills(this.#appState.profileData);
  }

  /**
   * 取得所有作品集
   * @returns {Array}
   */
  static getPortfolios() {
    if (!this.#appState.portfolioData) return [];
    return PortfolioRepository.getPortfolios(this.#appState.portfolioData);
  }

  /**
   * 根據工作經驗 ID 取得作品集，並整合 WorkExperience 資料
   * @param {string} workExpId - 工作經驗 ID
   * @returns {Object} 整合後的資料，包含工作經驗和作品集資訊
   */
  static getWorkExperienceWithPortfolio(workExpId) {
    if (!this.#appState.portfolioData || !this.#appState.workExperienceData) {
      return null;
    }

    const portfolio = PortfolioRepository.getPortfolioByWorkExpId(
      this.#appState.portfolioData,
      workExpId
    );

    if (!portfolio) return null;

    // 從 WorkExperience 取得對應的資料
    const workExperiences = WorkExperienceRepository.getParentWorkExperiences(
      this.#appState.workExperienceData
    );

    const workExp = workExperiences.find(exp => exp.id === workExpId);

    return {
      workExp,
      portfolio
    };
  }

  /**
   * 取得所有工作經驗（已排序）
   * @returns {Array}
   */
  static getSortedWorkExperiences() {
    if (!this.#appState.workExperienceData) return [];
    const workExps = WorkExperienceRepository.getParentWorkExperiences(
      this.#appState.workExperienceData
    );
    return this._sortByPeriodStart(workExps);
  }

  /**
   * 按期間開始時間排序（近的在上）
   * @param {Array} experiences - 工作經歷陣列
   * @returns {Array}
   * @private
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
   * @param {string} dateStr - 日期字串 (e.g., "2025.3")
   * @returns {number}
   * @private
   */
  static _parsePeriodDate(dateStr) {
    const [year, month] = dateStr.split('.');
    return parseInt(year + (month.padStart(2, '0') + '00'));
  }
}
