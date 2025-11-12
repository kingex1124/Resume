/**
 * Login Component
 * 登入畫面獨立元件，支援多頁面重用、多國語系
 * 套用 login-screen.css 樣式
 * 
 * 多國語系支援：
 * - 從 URL 參數 ?lang=ja 獲取語言
 * - 如無參數，預設使用中文 (zh-TW)
 * - 支持語言：zh-TW, ja, en
 */

import { i18nService } from '../services/i18nService.js';

export class LoginComponent {
  // 快取翻譯資料
  static #translationCache = {};
  
  // 當前語言
  static #currentLanguage = 'zh-TW';
  
  /**
   * 初始化登入畫面
   * @param {Object} options - 配置選項
   * @param {string} options.containerId - 容器元素 ID（預設: 'loginScreen'）
   * @param {Function} options.onLogin - 登入成功回調函數 (password) => {}
   * @param {Function} options.onCancel - 取消登入回調函數
   */
  static async initialize(options = {}) {
    const {
      containerId = 'loginScreen',
      onLogin = null,
      onCancel = null
    } = options;

    this.containerId = containerId;
    this.onLogin = onLogin;
    this.onCancel = onCancel;

    // 1. 偵測語言（從 URL 獲取或使用預設）
    this.#currentLanguage = this._detectLanguageFromURL();
    
    // 2. 初始化 i18nService
    i18nService.initialize(this.#currentLanguage);
    
    // 2. 加載登入翻譯
    const translations = await this._loadLoginTranslations(this.#currentLanguage);
    
    // 3. 建立登入畫面 HTML（使用翻譯）
    this._buildLoginScreen(translations);

    // 4. 綁定事件
    this._bindEvents();
  }

  /**
   * 建立登入畫面 HTML
   * @param {Object} translations - 翻譯物件
   * @private
   */
  static _buildLoginScreen(translations = {}) {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`❌ 找不到登入容器: ${this.containerId}`);
      return;
    }

    // 取得翻譯文本（帶預設值）
    const t = translations?.login || {};
    const title = t.title || '個人履歷';
    const subtitle = t.subtitle || '此內容已加密保護，請輸入密碼以檢視';
    const passwordLabel = t.passwordLabel || '密碼';
    const passwordPlaceholder = t.passwordPlaceholder || '請輸入密碼';
    const unlockButton = t.unlockButton || '解鎖並檢視';

    container.innerHTML = `
      <div class="login-box">
        <div class="lock-icon">🔒</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
        
        <div class="input-group">
          <label for="passwordInput">${passwordLabel}</label>
          <input 
            type="password" 
            id="passwordInput" 
            placeholder="${passwordPlaceholder}"
            autocomplete="current-password"
          >
        </div>
        
        <button class="btn" id="loginBtn">${unlockButton}</button>
        
        <div class="error-message" id="errorMessage"></div>
        
      </div>
    `;
    
    // 儲存翻譯物件供後續使用
    this._currentTranslations = translations;
  }

  /**
   * 綁定事件監聽器
   * @private
   */
  static _bindEvents() {
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.handleLogin();
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLogin();
        }
      });
    }
  }

  /**
   * 登入處理
   * @private
   */
  static async handleLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    if (!passwordInput) return;

    const password = passwordInput.value;
    
    // 取得翻譯文本
    const t = this._currentTranslations?.login || {};

    if (!password) {
      const errorText = t.errorPasswordRequired || '請輸入密碼';
      this.showError(errorText);
      return;
    }

    // 顯示載入狀態
    const decryptingText = t.decrypting || '解密中...';
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = decryptingText;
    }
    if (errorMessage) {
      errorMessage.classList.remove('show');
    }

    try {
      // 調用外部登入回調
      if (this.onLogin) {
        await this.onLogin(password);
      }
    } catch (error) {
      const errorPrefix = t.errorMessage || '登入失敗: ';
      this.showError(errorPrefix + error.message);
    } finally {
      const unlockButtonText = t.unlockButton || '解鎖並檢視';
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = unlockButtonText;
      }
    }
  }

  /**
   * 顯示錯誤訊息
   * @param {string} message - 錯誤訊息
   */
  static showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.add('show');
    }
  }

  /**
   * 清除錯誤訊息
   */
  static clearError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
      errorMessage.classList.remove('show');
      errorMessage.textContent = '';
    }
  }

  /**
   * 顯示登入畫面
   */
  static show() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.style.display = 'flex';
      container.classList.remove('hidden');
    }
  }

  /**
   * 隱藏登入畫面
   */
  static hide() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.classList.add('hidden');
      // 使用 !important 確保覆蓋 CSS 中的 display: flex
      container.style.display = 'none !important';
    }
  }

  /**
   * 重設登入表單
   */
  static reset() {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
      passwordInput.value = '';
    }
    this.clearError();
  }

  /**
   * 獲取輸入的密碼
   * @returns {string} 密碼值
   */
  static getPassword() {
    const passwordInput = document.getElementById('passwordInput');
    return passwordInput ? passwordInput.value : '';
  }

  /**
   * 設定密碼輸入框焦點
   */
  static focus() {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
      passwordInput.focus();
    }
  }

  // ============================================
  // 私有方法 - 語言與翻譯
  // ============================================

  /**
   * 從 URL 偵測語言
   * 優先順序：URL 參數 ?lang=ja > 預設 zh-TW
   * @returns {string} 語言代碼
   * @private
   */
  static _detectLanguageFromURL() {
    const params = new URLSearchParams(window.location.search);
    const urlLanguage = params.get('lang');
    
    const supportedLanguages = ['zh-TW', 'ja', 'en'];
    
    if (urlLanguage && supportedLanguages.includes(urlLanguage)) {
      return urlLanguage;
    }
    
    return 'zh-TW';
  }

  /**
   * 加載登入翻譯
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 翻譯物件
   * @private
   */
  static async _loadLoginTranslations(language) {
    try {
      const cacheKey = `login_${language}`;
      
      // 檢查快取
      if (this.#translationCache[cacheKey]) {
        return this.#translationCache[cacheKey];
      }

      // 從 i18nService 加載翻譯
      const translations = await i18nService.loadModuleTranslations('login', language);
      
      // 快取翻譯資料
      this.#translationCache[cacheKey] = translations;
      
      return translations;
    } catch (error) {
      console.error('❌ 加載登入翻譯失敗:', error.message);
      // 返回空物件，會使用預設值
      return {};
    }
  }

  /**
   * 設置語言（支援動態切換）
   * @param {string} language - 語言代碼
   */
  static async setLanguage(language) {
    const supportedLanguages = ['zh-TW', 'ja', 'en'];
    
    if (!supportedLanguages.includes(language)) {
      console.error(`❌ 不支援的語言: ${language}`);
      return;
    }

    this.#currentLanguage = language;
    
    // 加載新語言的翻譯
    const translations = await this._loadLoginTranslations(language);
    
    // 重新建立 UI
    this._buildLoginScreen(translations);
  }
}
