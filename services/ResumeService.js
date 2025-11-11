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

  /**
   * 初始化履歷資料
   * 
   * 流程：
   * 1. 初始化語言管理器
   * 2. 並行載入 Profile、Portfolio、WorkExperience 資料
   * 3. 如果 WorkExperience 被加密，檢查 Cookie 或顯示登入
   * 4. 初始化導覽和 UI 元件
   * 
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 應用狀態物件
   */
  static async initializeApp(language = 'zh-TW') {
    try {
      console.log('🚀 開始初始化履歷應用...');
      
      // 1. 初始化語言管理器（優先順序：URL > localStorage > 參數 > 預設）
      const detectedLanguage = LanguageManager.initialize();
      const finalLanguage = detectedLanguage || language || 'zh-TW';
      
      this.#appState.currentLanguage = finalLanguage;
      console.log(`🌐 應用語言已設置為: ${finalLanguage}`);

      // 初始化 i18n 服務
      i18nService.initialize(finalLanguage);

      // 1. 並行載入三種資料
      const [profileData, portfolioData, workExpData] = await Promise.all([
        ProfileRepository.loadProfileData(finalLanguage),
        PortfolioRepository.loadPortfolioData(finalLanguage),
        WorkExperienceRepository.loadWorkExperienceData(finalLanguage)
      ]);

      this.#appState.profileData = profileData;
      this.#appState.portfolioData = portfolioData;
      this.#appState.workExperienceData = workExpData;
      
      // 快取加密資料（如果被加密）
      if (profileData.encrypted === true) {
        this.#encryptedProfileData = profileData;
      }
      if (portfolioData.encrypted === true) {
        this.#encryptedPortfolioData = portfolioData;
      }
      if (workExpData.encrypted === true) {
        this.#encryptedWorkExperienceData = workExpData;
      }

      console.log('📥 所有資料已載入');

      // 2. 初始化登入元件
      LoginComponent.initialize({
        containerId: 'loginScreen',
        onLogin: (password) => this.handleLogin(password),
        onCancel: () => console.log('登入取消')
      });

      // 3. 檢查是否有任何加密資料需要解密
      const hasEncryptedData = profileData.encrypted === true || 
                                portfolioData.encrypted === true || 
                                workExpData.encrypted === true;

      if (hasEncryptedData) {
        console.log('🔍 偵測到加密資料，檢查 Cookie...');
        
        // 優先從 Cookie 還原會話
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          console.log('✅ 會話已還原');
          // 更新已解密的資料
          if (decryptResult.data.profile) {
            this.#appState.profileData = decryptResult.data.profile;
          }
          if (decryptResult.data.portfolio) {
            this.#appState.portfolioData = decryptResult.data.portfolio;
          }
          if (decryptResult.data.workExperience) {
            this.#appState.workExperienceData = decryptResult.data.workExperience;
          }
          return await this._initializeUI();
        } else {
          console.log('⚠️ 無有效會話，顯示登入畫面');
          LoginComponent.show();
          return this.#appState;
        }
      } else {
        // 非加密，直接初始化 UI
        console.log('ℹ️ 資料未加密，直接初始化');
        return await this._initializeUI();
      }
    } catch (error) {
      console.error('❌ 初始化失敗:', error.message);
      // 不呼叫 hideLoading，因為還沒設置
      console.error('詳細錯誤:', error);
      throw error;
    }
  }

  /**
   * 登入事件處理
   * @param {string} password - 使用者輸入的密碼
   */
  static async handleLogin(password) {
    try {
      console.log('🔐 開始登入流程...');

      const decryptedData = {};
      let successCount = 0;
      let totalEncrypted = 0;

      // 嘗試解密 profile 資料
      if (this.#encryptedProfileData) {
        totalEncrypted++;
        console.log('🔐 嘗試解密 Profile 資料...');
        const result = await LoginService.login(password, this.#encryptedProfileData);
        if (result.success) {
          decryptedData.profile = result.data;
          successCount++;
          console.log('✅ Profile 資料解密成功');
        } else {
          throw new Error('Profile 資料解密失敗: ' + result.message);
        }
      }

      // 嘗試解密 portfolio 資料
      if (this.#encryptedPortfolioData) {
        totalEncrypted++;
        console.log('🔐 嘗試解密 Portfolio 資料...');
        const result = await LoginService.login(password, this.#encryptedPortfolioData);
        if (result.success) {
          decryptedData.portfolio = result.data;
          successCount++;
          console.log('✅ Portfolio 資料解密成功');
        } else {
          throw new Error('Portfolio 資料解密失敗: ' + result.message);
        }
      }

      // 嘗試解密 workExperience 資料
      if (this.#encryptedWorkExperienceData) {
        totalEncrypted++;
        console.log('🔐 嘗試解密 WorkExperience 資料...');
        const result = await LoginService.login(password, this.#encryptedWorkExperienceData);
        if (result.success) {
          decryptedData.workExperience = result.data;
          successCount++;
          console.log('✅ WorkExperience 資料解密成功');
        } else {
          throw new Error('WorkExperience 資料解密失敗: ' + result.message);
        }
      }

      // 檢查是否所有加密資料都成功解密
      if (successCount === totalEncrypted && totalEncrypted > 0) {
        console.log(`✅ 所有 ${totalEncrypted} 個加密資料源成功解密`);
        
        // 更新應用狀態
        if (decryptedData.profile) {
          this.#appState.profileData = decryptedData.profile;
        }
        if (decryptedData.portfolio) {
          this.#appState.portfolioData = decryptedData.portfolio;
        }
        if (decryptedData.workExperience) {
          this.#appState.workExperienceData = decryptedData.workExperience;
        }
        
        await this._initializeUI();
      } else if (totalEncrypted === 0) {
        // 沒有加密資料需要解密
        console.log('ℹ️ 沒有加密資料需要解密');
        await this._initializeUI();
      }
    } catch (error) {
      LoginComponent.showError('登入失敗: ' + error.message);
      console.error('❌ 登入錯誤:', error);
    }
  }

  /**
   * 嘗試從 Cookie 還原會話
   * @param {Object} encryptedData - 加密資料（可選，預設使用緩存的加密資料）
   * @returns {Promise<Object>}
   */
  static async tryRestoreSession(encryptedData = null) {
    try {
      console.log('🔄 嘗試還原會話...');

      const decryptedData = {};
      let successCount = 0;

      // 嘗試還原 profile 資料
      if (this.#encryptedProfileData) {
        console.log('🔄 嘗試還原 Profile...');
        const result = await LoginService.restoreSession(this.#encryptedProfileData);
        if (result.success) {
          decryptedData.profile = result.data;
          successCount++;
          console.log('✅ Profile 已還原');
        }
      }

      // 嘗試還原 portfolio 資料
      if (this.#encryptedPortfolioData) {
        console.log('🔄 嘗試還原 Portfolio...');
        const result = await LoginService.restoreSession(this.#encryptedPortfolioData);
        if (result.success) {
          decryptedData.portfolio = result.data;
          successCount++;
          console.log('✅ Portfolio 已還原');
        }
      }

      // 嘗試還原 workExperience 資料
      if (this.#encryptedWorkExperienceData) {
        console.log('🔄 嘗試還原 WorkExperience...');
        const result = await LoginService.restoreSession(this.#encryptedWorkExperienceData);
        if (result.success) {
          decryptedData.workExperience = result.data;
          successCount++;
          console.log('✅ WorkExperience 已還原');
        }
      }

      // 檢查是否至少還原了一個資料源
      if (successCount > 0) {
        console.log(`✅ 會話已還原 (${successCount} 個資料源)`);
        return { success: true, data: decryptedData };
      } else {
        console.log('ℹ️ 無有效會話');
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

      console.log('✅ UI 初始化完成');
      return this.#appState;
    } catch (error) {
      console.error('❌ UI 初始化失敗:', error);
      LoadingAndErrorComponent.showError('loading-error-container', '初始化失敗: ' + error.message);
      throw error;
    }
  }

  /**
   * 語言切換事件處理
   * @param {string} language - 新語言代碼
   */
  static async handleLanguageChange(language) {
    try {
      console.log(`🌐 切換語言為: ${language}`);
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

      // 快取新語言的加密資料（如果被加密）
      if (profileData.encrypted === true) {
        this.#encryptedProfileData = profileData;
        console.log('🔐 新語言的 Profile 被加密');
      } else {
        this.#encryptedProfileData = null;
        this.#appState.profileData = profileData;
      }

      if (portfolioData.encrypted === true) {
        this.#encryptedPortfolioData = portfolioData;
        console.log('🔐 新語言的 Portfolio 被加密');
      } else {
        this.#encryptedPortfolioData = null;
        this.#appState.portfolioData = portfolioData;
      }

      if (workExpData.encrypted === true) {
        this.#encryptedWorkExperienceData = workExpData;
        console.log('� 新語言的 WorkExperience 被加密');
      } else {
        this.#encryptedWorkExperienceData = null;
        this.#appState.workExperienceData = workExpData;
      }

      // 檢查是否有加密資料需要重新解密
      const hasEncryptedData = profileData.encrypted === true || 
                                portfolioData.encrypted === true || 
                                workExpData.encrypted === true;

      if (hasEncryptedData) {
        console.log('🔍 新語言有加密資料，嘗試用 Cookie 重新解密...');
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          console.log('✅ 已用 Cookie 重新解密');
          if (decryptResult.data.profile) {
            this.#appState.profileData = decryptResult.data.profile;
          }
          if (decryptResult.data.portfolio) {
            this.#appState.portfolioData = decryptResult.data.portfolio;
          }
          if (decryptResult.data.workExperience) {
            this.#appState.workExperienceData = decryptResult.data.workExperience;
          }
        } else {
          console.log('⚠️ 無有效會話，保持加密狀態');
          // 保持加密狀態
        }
      }

      // 重新載入翻譯並更新頁面
      const translations = await this.getResumeTranslations(language);
      this.#appState.translations = translations;

      // 無刷新更新：觸發 renderPage 重新渲染
      const ResumeApp = (await import('../components/ResumeApp.js')).default;
      const app = new ResumeApp();
      app.renderPage();

      // 更新 URL（不刷新頁面）
      const url = new URL(window.location);
      url.searchParams.set('lang', language);
      window.history.replaceState({}, '', url);

      console.log('✅ 語言切換完成');
    } catch (error) {
      console.error('❌ 語言切換失敗:', error);
    }
  }

  /**
   * 登出事件處理
   */
  static async handleLogout() {
    try {
      console.log('🚪 開始登出流程...');
      
      // 清除會話和 Cookie
      LoginService.logout();
      
      // 保留應用狀態中的加密資料，但重置已解密的資料
      if (this.#encryptedProfileData) {
        this.#appState.profileData = this.#encryptedProfileData;
      }
      if (this.#encryptedPortfolioData) {
        this.#appState.portfolioData = this.#encryptedPortfolioData;
      }
      if (this.#encryptedWorkExperienceData) {
        this.#appState.workExperienceData = this.#encryptedWorkExperienceData;
      }
      
      // 隱藏主要內容，顯示登入畫面
      const mainContent = document.getElementById('resume-container');
      if (mainContent) {
        mainContent.style.display = 'none';
        mainContent.classList.add('hidden');
      }
      
      // 清除不必要的 DOM 元素
      const app = document.getElementById('resume-app');
      if (app) {
        app.innerHTML = '';
      }
      
      // 顯示登入畫面
      LoginComponent.show();
      
      console.log('✅ 登出完成，顯示登入畫面');
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
      console.log(`📦 清除翻譯快取: ${cacheKey}`);
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
