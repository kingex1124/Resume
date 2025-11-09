/**
 * Language Manager - 語言持久化管理
 * 負責 URL 參數、localStorage 和語言狀態管理
 * 
 * 使用方式:
 *   LanguageManager.initialize();
 *   const lang = LanguageManager.getCurrentLanguage();
 *   LanguageManager.setLanguage('ja');
 */

export class LanguageManager {
  // 常數
  static DEFAULT_LANGUAGE = 'zh-TW';
  static SUPPORTED_LANGUAGES = ['zh-TW', 'ja', 'en'];
  static URL_PARAM_NAME = 'lang';
  static STORAGE_KEY = 'app_language';

  // 私有屬性
  static #currentLanguage = LanguageManager.DEFAULT_LANGUAGE;
  static #isInitialized = false;

  /**
   * 初始化語言管理器
   * 優先順序：URL 參數 > localStorage > 預設語言
   * @returns {string} 確定的語言代碼
   */
  static initialize() {
    if (this.#isInitialized) {
      console.warn('⚠️ LanguageManager 已初始化');
      return this.#currentLanguage;
    }

    // 1️⃣ 先檢查 URL 參數
    const urlLanguage = this._getLanguageFromURL();
    if (urlLanguage) {
      this.#currentLanguage = urlLanguage;
      console.log(`✅ 從 URL 獲取語言: ${urlLanguage}`);
      // 同時保存到 localStorage 以供下次使用
      this._saveLanguageToStorage(urlLanguage);
      this.#isInitialized = true;
      return urlLanguage;
    }

    // 2️⃣ 再檢查 localStorage
    const savedLanguage = this._getLanguageFromStorage();
    if (savedLanguage) {
      this.#currentLanguage = savedLanguage;
      console.log(`✅ 從 localStorage 獲取語言: ${savedLanguage}`);
      this.#isInitialized = true;
      return savedLanguage;
    }

    // 3️⃣ 使用預設語言
    this.#currentLanguage = this.DEFAULT_LANGUAGE;
    console.log(`✅ 使用預設語言: ${this.DEFAULT_LANGUAGE}`);
    this._saveLanguageToStorage(this.DEFAULT_LANGUAGE);
    this.#isInitialized = true;
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * 取得當前語言
   * @returns {string} 語言代碼
   */
  static getCurrentLanguage() {
    if (!this.#isInitialized) {
      console.warn('⚠️ LanguageManager 未初始化，自動初始化');
      this.initialize();
    }
    return this.#currentLanguage;
  }

  /**
   * 設置語言並更新 URL 和 localStorage
   * @param {string} language - 語言代碼
   * @returns {boolean} 設置是否成功
   */
  static setLanguage(language) {
    // 驗證語言有效性
    if (!this.SUPPORTED_LANGUAGES.includes(language)) {
      console.error(`❌ 不支援的語言: ${language}`);
      return false;
    }

    this.#currentLanguage = language;

    // 保存到 localStorage
    this._saveLanguageToStorage(language);

    // 更新 URL（不重新加載頁面）
    this._updateURLParameter(language);

    console.log(`🌐 語言已設置為: ${language}`);
    return true;
  }

  /**
   * 從 URL 參數中獲取語言
   * @returns {string|null} 語言代碼或 null
   * @private
   */
  static _getLanguageFromURL() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get(this.URL_PARAM_NAME);

    if (lang && this.SUPPORTED_LANGUAGES.includes(lang)) {
      return lang;
    }
    return null;
  }

  /**
   * 從 localStorage 中獲取語言
   * @returns {string|null} 語言代碼或 null
   * @private
   */
  static _getLanguageFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && this.SUPPORTED_LANGUAGES.includes(stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('⚠️ 無法讀取 localStorage:', e.message);
    }
    return null;
  }

  /**
   * 保存語言到 localStorage
   * @param {string} language - 語言代碼
   * @private
   */
  static _saveLanguageToStorage(language) {
    try {
      localStorage.setItem(this.STORAGE_KEY, language);
      console.log(`💾 語言已保存到 localStorage: ${language}`);
    } catch (e) {
      console.warn('⚠️ 無法保存到 localStorage:', e.message);
    }
  }

  /**
   * 更新 URL 參數（使用 History API，不重新加載）
   * @param {string} language - 語言代碼
   * @private
   */
  static _updateURLParameter(language) {
    try {
      const url = new URL(window.location);
      url.searchParams.set(this.URL_PARAM_NAME, language);
      
      // 使用 History API 更新 URL 而不重新加載頁面
      window.history.replaceState({ language }, '', url.toString());
      
      console.log(`🔗 URL 已更新: ${url.toString()}`);
    } catch (e) {
      console.warn('⚠️ 無法更新 URL:', e.message);
    }
  }

  /**
   * 生成帶有語言參數的 URL
   * @param {string} path - 頁面路徑 (e.g., 'portfolio.html')
   * @param {string} language - 語言代碼 (可選，預設使用當前語言)
   * @returns {string} 完整 URL
   */
  static generateLanguageURL(path, language = null) {
    const lang = language || this.#currentLanguage;
    const baseURL = `${window.location.origin}${window.location.pathname}`;
    const baseDir = baseURL.substring(0, baseURL.lastIndexOf('/') + 1);
    
    return `${baseDir}${path}?${this.URL_PARAM_NAME}=${lang}`;
  }

  /**
   * 添加語言參數到現有 URL
   * @param {string} url - 原始 URL
   * @param {string} language - 語言代碼 (可選)
   * @returns {string} 添加語言參數後的 URL
   */
  static addLanguageToURL(url, language = null) {
    const lang = language || this.#currentLanguage;
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set(this.URL_PARAM_NAME, lang);
    return urlObj.toString();
  }

  /**
   * 清除語言設置（重置為預設）
   */
  static reset() {
    this.#currentLanguage = this.DEFAULT_LANGUAGE;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('⚠️ 無法清除 localStorage');
    }
    this._updateURLParameter(this.DEFAULT_LANGUAGE);
    console.log('🔄 語言設置已重置');
  }

  /**
   * 取得所有支援的語言
   * @returns {Array<string>} 語言代碼陣列
   */
  static getSupportedLanguages() {
    return [...this.SUPPORTED_LANGUAGES];
  }

  /**
   * 取得語言管理狀態
   * @returns {Object} 狀態物件
   */
  static getStatus() {
    return {
      isInitialized: this.#isInitialized,
      currentLanguage: this.#currentLanguage,
      urlLanguage: this._getLanguageFromURL(),
      storageLanguage: this._getLanguageFromStorage(),
      supportedLanguages: this.SUPPORTED_LANGUAGES
    };
  }
}

/*
══════════════════════════════════════════════════════════════════
使用範例
══════════════════════════════════════════════════════════════════

1. 初始化（在應用啟動時）
   LanguageManager.initialize();

2. 取得當前語言
   const lang = LanguageManager.getCurrentLanguage();  // 'zh-TW'

3. 設置語言
   LanguageManager.setLanguage('ja');  // 自動更新 URL 和 localStorage

4. 生成帶語言參數的 URL
   const portfolioURL = LanguageManager.generateLanguageURL('portfolio.html');
   // 返回: https://example.com/portfolio.html?lang=zh-TW

5. 添加語言參數到 URL
   const newURL = LanguageManager.addLanguageToURL('profile.html');
   // 返回: https://example.com/profile.html?lang=zh-TW

6. 導航到其他頁面（保持語言）
   window.location.href = LanguageManager.generateLanguageURL('portfolio.html');

7. 檢查狀態
   console.log(LanguageManager.getStatus());

8. 重置為預設語言
   LanguageManager.reset();

══════════════════════════════════════════════════════════════════
工作流程
══════════════════════════════════════════════════════════════════

應用啟動:
  ↓
  LanguageManager.initialize()
  ↓
  優先順序檢查:
    1. URL 參數 (?lang=ja)
    2. localStorage (app_language)
    3. 預設語言 (zh-TW)
  ↓
  返回確定的語言代碼

用戶切換語言:
  ↓
  LanguageManager.setLanguage('ja')
  ↓
  1. 更新 #currentLanguage
  2. 保存到 localStorage
  3. 更新 URL (?lang=ja)
  ↓
  應用界面相應更新

用戶導航到其他頁面:
  ↓
  1. 使用 generateLanguageURL() 或 addLanguageToURL()
  2. URL 包含 lang 參數
  ↓
  新頁面載入時:
    1. 讀取 URL lang 參數
    2. LanguageManager.initialize() 會取得該參數
    3. 自動應用正確的語言
  ↓
  用戶看到相同的語言設置 ✅

══════════════════════════════════════════════════════════════════
*/
