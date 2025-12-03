/**
 * Settings Loader Component
 * 設定檔載入元件 - 負責載入和管理應用程式設定
 * 
 * 遵循 ComponentRule 設計規則
 */

export class SettingsLoader {
  static #settings = null;
  static #loaded = false;

  /**
   * 載入設定檔
   * 
   * @param {string} path - 設定檔路徑（預設: './settings.json'）
   * @returns {Promise<Object>} 設定物件
   */
  static async load(path = './settings.json') {
    // 如果已載入，直接回傳快取
    if (this.#loaded && this.#settings) {
      return this.#settings;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        console.warn('⚠️ 無法載入設定檔，使用預設值');
        this.#settings = this._getDefaultSettings();
        this.#loaded = true;
        return this.#settings;
      }
      
      this.#settings = await response.json();
      this.#loaded = true;
      console.log('✅ 設定檔載入完成');
      return this.#settings;
    } catch (error) {
      console.warn('⚠️ 載入設定檔失敗，使用預設值:', error.message);
      this.#settings = this._getDefaultSettings();
      this.#loaded = true;
      return this.#settings;
    }
  }

  /**
   * 取得設定值
   * 
   * @param {string} key - 設定鍵值（支援點分隔，如 'features.showSkillsStats'）
   * @param {any} defaultValue - 預設值（當找不到設定時回傳）
   * @returns {any} 設定值
   */
  static get(key, defaultValue = null) {
    if (!this.#settings) return defaultValue;
    
    const keys = key.split('.');
    let value = this.#settings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * 取得所有設定
   * 
   * @returns {Object} 完整設定物件副本
   */
  static getAll() {
    return this.#settings ? { ...this.#settings } : this._getDefaultSettings();
  }

  /**
   * 檢查設定是否已載入
   * 
   * @returns {boolean} 是否已載入
   */
  static isLoaded() {
    return this.#loaded;
  }

  /**
   * 重新載入設定檔
   * 
   * @param {string} path - 設定檔路徑
   * @returns {Promise<Object>} 設定物件
   */
  static async reload(path = './settings.json') {
    this.#loaded = false;
    this.#settings = null;
    return await this.load(path);
  }

  /**
   * 取得預設設定
   * 
   * @private
   * @returns {Object} 預設設定物件
   */
  static _getDefaultSettings() {
    return {
      features: {
        showSkillsStats: true
      }
    };
  }
}
