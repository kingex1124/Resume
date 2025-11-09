/**
 * Internationalization (i18n) Service Layer
 * 多頁面共用的國際化服務，負責翻譯資料加載、快取和語言管理
 */

export class i18nService {
  // 靜態屬性：翻譯快取
  static #translationCache = {};
  static #currentLanguage = 'zh-TW';
  static #supportedLanguages = ['zh-TW', 'ja', 'en'];

  /**
   * 初始化 i18n 服務
   * @param {string} defaultLanguage - 預設語言
   */
  static initialize(defaultLanguage = 'zh-TW') {
    if (!this.#supportedLanguages.includes(defaultLanguage)) {
      console.warn(`❌ 不支援的語言: ${defaultLanguage}，使用預設值: zh-TW`);
      defaultLanguage = 'zh-TW';
    }
    this.#currentLanguage = defaultLanguage;
    console.log(`✅ i18n 服務已初始化，當前語言: ${this.#currentLanguage}`);
  }

  /**
   * 取得當前語言
   * @returns {string} 當前語言代碼
   */
  static getCurrentLanguage() {
    return this.#currentLanguage;
  }

  /**
   * 設置當前語言
   * @param {string} language - 語言代碼
   * @returns {boolean} 是否設置成功
   */
  static setCurrentLanguage(language) {
    if (!this.#supportedLanguages.includes(language)) {
      console.warn(`❌ 不支援的語言: ${language}`);
      return false;
    }
    this.#currentLanguage = language;
    console.log(`🌐 語言已切換為: ${language}`);
    return true;
  }

  /**
   * 取得支援的語言列表
   * @returns {Array<string>} 支援的語言代碼陣列
   */
  static getSupportedLanguages() {
    return [...this.#supportedLanguages];
  }

  /**
   * 加載特定模組的翻譯檔案
   * @param {string} moduleName - 模組名稱（例如：'work-experience'）
   * @param {string} language - 語言代碼，預設使用當前語言
   * @returns {Promise<Object>} 翻譯物件
   */
  static async loadModuleTranslations(moduleName, language = null) {
    const lang = language || this.#currentLanguage;
    const cacheKey = `${moduleName}_${lang}`;

    // 檢查快取
    if (this.#translationCache[cacheKey]) {
      console.log(`📦 使用快取翻譯: ${cacheKey}`);
      return this.#translationCache[cacheKey];
    }

    try {
      // 從 JSON 檔案加載翻譯 work-experience.json
      const response = await fetch(`./i18n/translations/${moduleName}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 無法加載翻譯檔案`);
      }

      const allTranslations = await response.json();
      const translations = allTranslations[lang];

      if (!translations) {
        console.warn(`⚠️ 翻譯檔案中不包含語言: ${lang}，使用 zh-TW 作為備用`);
        return allTranslations['zh-TW'] || {};
      }

      // 快取翻譯資料
      this.#translationCache[cacheKey] = translations;
      console.log(`✅ 翻譯已加載並快取: ${cacheKey}`);
      
      return translations;
    } catch (error) {
      console.error(`❌ 加載翻譯失敗 (${moduleName}, ${lang}):`, error.message);
      throw error;
    }
  }

  /**
   * 一次加載多個模組的翻譯檔案
   * @param {Array<string>} moduleNames - 模組名稱陣列
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} { moduleName: translations, ... }
   */
  static async loadMultipleModuleTranslations(moduleNames, language = null) {
    const promises = moduleNames.map(moduleName =>
      this.loadModuleTranslations(moduleName, language)
        .then(translations => ({ moduleName, translations }))
        .catch(error => {
          console.error(`❌ 模組翻譯加載失敗: ${moduleName}`, error);
          return { moduleName, translations: null, error };
        })
    );

    const results = await Promise.all(promises);
    const combined = {};

    for (const result of results) {
      if (result.translations) {
        combined[result.moduleName] = result.translations;
      }
    }

    return combined;
  }

  /**
   * 清除翻譯快取（用於語言切換或調試）
   * @param {string} moduleName - 特定模組名稱，如果為空則清除全部快取
   */
  static clearCache(moduleName = null) {
    if (moduleName) {
      // 清除特定模組的快取
      for (const lang of this.#supportedLanguages) {
        const cacheKey = `${moduleName}_${lang}`;
        if (this.#translationCache[cacheKey]) {
          delete this.#translationCache[cacheKey];
        }
      }
      console.log(`🗑️ 已清除模組快取: ${moduleName}`);
    } else {
      // 清除所有快取
      this.#translationCache = {};
      console.log('🗑️ 已清除所有翻譯快取');
    }
  }

  /**
   * 取得巢狀翻譯鍵值
   * @param {Object} translations - 翻譯物件
   * @param {string} keyPath - 鍵路徑，使用點符號分隔 (例如: 'workExperience.modal.close')
   * @param {string} fallback - 回退文本
   * @returns {string} 翻譯文本
   */
  static getTranslationByPath(translations, keyPath, fallback = keyPath) {
    const keys = keyPath.split('.');
    let current = translations;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        console.warn(`⚠️ 翻譯鍵未找到: ${keyPath}，使用回退: ${fallback}`);
        return fallback;
      }
    }

    return typeof current === 'string' ? current : fallback;
  }

  /**
   * 批量取得翻譯文本（使用鍵路徑陣列）
   * @param {Object} translations - 翻譯物件
   * @param {Array<string>} keyPaths - 鍵路徑陣列
   * @returns {Object} { keyPath: translation, ... }
   */
  static getMultipleTranslations(translations, keyPaths) {
    const result = {};
    
    for (const keyPath of keyPaths) {
      result[keyPath] = this.getTranslationByPath(translations, keyPath);
    }

    return result;
  }

  /**
   * 驗證翻譯物件的完整性
   * @param {Object} translations - 翻譯物件
   * @param {Array<string>} requiredKeys - 必需的鍵路徑陣列
   * @returns {Object} { valid: boolean, missing: Array<string> }
   */
  static validateTranslations(translations, requiredKeys) {
    const missing = [];

    for (const keyPath of requiredKeys) {
      const value = this.getTranslationByPath(translations, keyPath, null);
      if (value === null || value === keyPath) {
        missing.push(keyPath);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * 格式化翻譯文本（支援簡單的變數替換）
   * @param {string} template - 翻譯模板文本
   * @param {Object} variables - 變數物件 { key: value, ... }
   * @returns {string} 格式化後的文本
   */
  static formatTranslation(template, variables = {}) {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return result;
  }

  /**
   * 取得翻譯統計資訊
   * @returns {Object} { cachedModules: number, totalCacheSize: string }
   */
  static getCacheStats() {
    const cachedModules = Object.keys(this.#translationCache).length;
    const cacheSize = new Blob(
      Object.values(this.#translationCache).map(t => JSON.stringify(t))
    ).size;

    return {
      cachedModules,
      totalCacheSize: `${(cacheSize / 1024).toFixed(2)} KB`,
      currentLanguage: this.#currentLanguage,
      supportedLanguages: this.#supportedLanguages
    };
  }
}
