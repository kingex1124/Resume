/**
 * Index Service Layer
 * 處理首頁的業務邏輯：登入、語言管理、UI 初始化等
 * 
 * 完全參考 WorkExperienceService 的架構模式
 * 支援加密資料驗證和 Cookie 還原
 */

import { i18nService } from './i18nService.js';
import { LoginService } from './LoginService.js';
import { LanguageManager } from '../i18n/LanguageManager.js';
import { Navigation } from '../components/Navigation.js';
import { LoginComponent } from '../components/LoginComponent.js';

export class IndexService {
  // 快取翻譯資料（按 "index_{language}" 鍵值儲存）
  static #translationCache = {};

  // 應用狀態
  static #appState = {
    currentLanguage: 'zh-TW',
    contentData: null,          // 未來會存放個人簡介、性格等資料
    translations: null
  };

  // 加密資料快取（從 Repository 加載，用於登入檢查）
  static #encryptedData = null;

  /**
   * 初始化應用狀態（從語言檢測開始）
   * 
   * 流程：
   * 1. 初始化語言管理器（優先順序：URL > localStorage > 參數 > 預設）
   * 2. 載入首頁資料（可能是加密或明文）
   * 3. 初始化登入元件
   * 4. 優先檢查 Cookie 還原會話 (如失敗 → 顯示登入)
   * 5. 初始化 UI
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

      // 2️⃣ 載入首頁資料（通過動態 import）
      const indexData = await this._loadIndexData(finalLanguage);
      this.#encryptedData = indexData;
      
      console.log(`📥 首頁資料已載入，加密狀態: ${indexData.encrypted}`);

      // 3️⃣ 初始化登入元件
      LoginComponent.initialize({
        containerId: 'loginScreen',
        onLogin: (password) => this.handleLogin(password),
        onCancel: () => console.log('登入取消')
      });

      LoginComponent.hide();
      console.log('✅ 登入元件已初始化');

      // 4️⃣ 只有加密資料才需要檢查 Cookie
      if (indexData.encrypted === true) {
        console.log('🔍 偵測到加密資料，先檢查 Cookie...');
        
        // 優先嘗試從 Cookie 還原會話
        const decryptResult = await this.tryRestoreSession();

        if (decryptResult.success) {
          console.log('✅ 會話已還原，資料已自動解密');
          this.#appState.contentData = decryptResult.data;
          return await this._initializeUI();
        } else {
          console.log('⚠️ Cookie 無效或已過期，顯示登入畫面');
          // 沒有有效的 Cookie，顯示登入介面
          LoginComponent.show();
          return this.#appState;
        }
      } else {
        // 非加密資料，直接使用
        console.log('ℹ️ 非加密資料，直接載入');
        this.#appState.contentData = indexData;
        return await this._initializeUI();
      }
    } catch (error) {
      console.error('❌ 應用初始化失敗:', error.message);
      throw error;
    }
  }

  /**
   * 載入首頁資料
   * 通過動態 import 加載資料檔案
   * 
   * @private
   */
  static async _loadIndexData(language) {
    try {
      // 動態導入資料檔案
      const filename = `resume-profile-${language}.json`;
      const response = await fetch(`./data/${filename}`);
      
      if (!response.ok) {
        throw new Error(`無法載入 ${filename}: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ 載入首頁資料失敗:', error);
      throw error;
    }
  }

  /**
   * 初始化 UI
   * 隱藏登入畫面、初始化導覽、載入翻譯等
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
      const translations = await this.getIndexUITranslations(this.#appState.currentLanguage);
      this.#appState.translations = translations;

      // 3️⃣ 初始化導覽欄
      await Navigation.initialize({
        containerId: 'navigation',
        currentLanguage: this.#appState.currentLanguage,
        onLanguageChange: (lang) => this.handleLanguageChange(lang),
        onLogout: () => this.handleLogout()
      });

      // 4️⃣ 顯示主要內容和導覽欄
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
   * 登入事件處理
   * 使用密碼解密資料
   * 
   * @param {string} password - 使用者輸入的密碼
   */
  static async handleLogin(password) {
    try {
      console.log('🔐 開始登入流程...');

      if (!this.#encryptedData) {
        LoginComponent.showError('❌ 缺少加密資料，無法登入');
        return;
      }

      // 使用 LoginService 解密資料
      const result = await LoginService.login(password, this.#encryptedData);

      if (result.success) {
        console.log('✅ 登入成功，資料已解密');
        
        // 更新應用狀態
        this.#appState.contentData = result.data;
        
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
   * 語言切換事件處理
   * 
   * 流程：
   * 1. 更新語言管理器（自動更新 URL 和 localStorage）
   * 2. 更新 i18n 服務
   * 3. 清除舊語言的翻譯快取
   * 4. 檢查加密資料並重新解密（如果需要）
   * 5. 重新初始化 UI
   * 
   * @param {string} language - 新語言代碼
   */
  static async handleLanguageChange(language) {
    try {
      console.log(`🌐 語言切換為: ${language}`);

      // 1. 更新語言管理器（自動更新 URL 和 localStorage）
      LanguageManager.setLanguage(language);

      // 2. 更新 i18n 服務
      i18nService.setCurrentLanguage(language);

      // 3. 更新應用狀態
      this.#appState.currentLanguage = language;

      // 4. 清除舊語言快取並重新載入翻譯
      this.clearTranslationCache(language);
      const translations = await this.getIndexUITranslations(language);
      this.#appState.translations = translations;

      // 5. 更新導覽欄菜單（Navigation 會自動載入正確的翻譯）
      Navigation.updateMenuByLanguage(language);

      console.log('✅ 語言切換完成');
    } catch (error) {
      console.error('❌ 語言切換失敗:', error);
    }
  }

  /**
   * 登出事件處理
   * 清除會話並回到登入狀態
   */
  static async handleLogout() {
    try {
      console.log('🚪 開始登出流程...');

      // 清除會話和 Cookie
      LoginService.logout();

      // 重置內容資料
      this.#appState.contentData = null;

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

      // 顯示登入畫面
      if (this.#encryptedData && this.#encryptedData.encrypted === true) {
        LoginComponent.show();
      }

      console.log('✅ 登出完成，Cookie 已清除');
    } catch (error) {
      console.error('❌ 登出失敗:', error);
    }
  }

  // ============================================
  // 翻譯相關方法
  // ============================================

  /**
   * 加載首頁模組的翻譯資料
   * 
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 首頁翻譯物件
   */
  static async loadIndexTranslations(language) {
    try {
      const cacheKey = `index_${language}`;

      // 檢查本地快取
      if (this.#translationCache[cacheKey]) {
        console.log(`📦 使用本地快取翻譯: ${cacheKey}`);
        return this.#translationCache[cacheKey];
      }

      // 從 i18nService 加載翻譯
      const translations = await i18nService.loadModuleTranslations('common', language);

      // 快取翻譯資料
      this.#translationCache[cacheKey] = translations;

      return translations;
    } catch (error) {
      console.error('❌ 加載首頁翻譯失敗:', error.message);
      throw error;
    }
  }

  /**
   * 取得首頁 UI 文本（共用翻譯）
   * 
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 包含所有 UI 文本的翻譯物件
   */
  static async getIndexUITranslations(language) {
    const translations = await this.loadIndexTranslations(language);

    return {
      common: translations?.common || {},
      navigation: translations?.navigation || {}
    };
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
        console.log(`🗑️ 已清除快取: ${cacheKey}`);
      }
    } else {
      this.#translationCache = {};
      console.log('🗑️ 已清除所有首頁翻譯快取');
    }
  }

  // ============================================
  // 取得應用狀態相關方法
  // ============================================

  /**
   * 取得應用狀態
   * @returns {Object} 當前應用狀態
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
   * 取得內容資料（未來用於個人簡介、性格等）
   * @returns {Object} 內容資料
   */
  static getContentData() {
    return this.#appState.contentData;
  }

  /**
   * 設定內容資料（未來用於個人簡介、性格等）
   * @param {Object} data - 內容資料
   */
  static setContentData(data) {
    this.#appState.contentData = data;
    console.log('📦 內容資料已更新');
  }
}
