/**
 * Navigation Component
 * 共用導覽欄元件：包含登出按鈕、導覽菜單、語系切換下拉選單
 */

import { i18nService } from '../services/i18nService.js';

export class Navigation {
  /**
   * 初始化導覽欄
   * @param {Object} options - 配置選項
   * @param {string} options.containerId - 容器元素 ID
   * @param {Array} options.menuItems - 菜單項目陣列
   * @param {Array} options.languages - 支援的語言陣列
   * @param {string} options.currentLanguage - 當前語言
   * @param {Function} options.onLanguageChange - 語言切換回調函數
   * @param {Function} options.onLogout - 登出回調函數
   */
  static async initialize(options = {}) {
    const {
      containerId = 'navigation',
      languages = [
        { code: 'zh-TW', name: '中文' },
        { code: 'ja', name: '日本語' },
        { code: 'en', name: 'English' }
      ],
      currentLanguage = 'zh-TW',
      onLanguageChange = null,
      onLogout = null
    } = options;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ 找不到導覽欄容器: ${containerId}`);
      return;
    }
    
    // 1. 自動從 i18nService 載入導覽列翻譯
    const navigationTranslations = await this.loadNavigationTranslations(currentLanguage);
    
    // 2. 使用翻譯資料生成菜單項目
    const menuItems = this.getMenuItemsByLanguage(navigationTranslations);
    
    // 3. 建立導覽欄 HTML
    container.innerHTML = this._buildNavHTML(menuItems, languages);
    
    // 4. 綁定事件
    this._bindEvents({
      languages,
      currentLanguage,
      onLanguageChange,
      onLogout,
      translations: navigationTranslations
    });
    
    console.log('✅ 導覽欄初始化完成');
  }
  
  /**
   * 建立導覽欄 HTML 結構
   * @param {Array} menuItems - 菜單項目
   * @param {Array} languages - 語言清單
   * @returns {string} HTML 字串
   * @private
   */
  static _buildNavHTML(menuItems, languages) {
    const menuItemsHTML = menuItems
      .map((item, idx) => `<a href="${item.url}" class="nav-menu-item" data-menu-id="${idx}" data-url="${item.url}">${item.label}</a>`)
      .join('');
    
    const languageOptionsHTML = languages
      .map((lang) => `<option value="${lang.code}">${lang.name}</option>`)
      .join('');
    
    return `
      <nav class="navigation-bar">
        <div class="nav-container">
          <!-- Logo / Brand -->
          <div class="nav-brand">
            <span class="nav-brand-text">履歷系統</span>
          </div>
          
          <!-- Hamburger Menu Button (Mobile Only) -->
          <button id="hamburger-btn" class="hamburger-btn">
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <!-- Menu Items -->
          <div class="nav-menu" id="nav-menu">
            ${menuItemsHTML}
          </div>
          
          <!-- Right Section: Language Selector & Logout -->
          <div class="nav-right">
            <div class="language-selector">
              <label for="language-select" class="language-label" data-i18n-key="navigation.language">語言:</label>
              <select id="language-select" class="language-dropdown">
                ${languageOptionsHTML}
              </select>
            </div>
            
            <button id="logout-btn" class="logout-button" data-i18n-key="navigation.logout">登出</button>
          </div>
        </div>
      </nav>
    `;
  }
  
  /**
   * 綁定事件監聽器
   * @param {Object} callbacks - 回調函數集合
   * @private
   */
  static _bindEvents(callbacks) {
    const { languages, currentLanguage, onLanguageChange, onLogout, translations } = callbacks;
    
    // 初始化時更新 i18n 元素
    if (translations && translations.navigation) {
      this._updateI18nElements(translations);
    }
    
    // 漢堡菜單按鈕事件（手機版）
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburgerBtn && navMenu) {
      hamburgerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navMenu.classList.toggle('active');
        console.log('📱 漢堡菜單切換');
      });
    }
    
    // 點擊頁面其他地方時收闔菜單
    document.addEventListener('click', (e) => {
      if (navMenu && navMenu.classList.contains('active')) {
        // 如果點擊不是菜單或漢堡按鈕，則收闔
        if (!navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
          navMenu.classList.remove('active');
        }
      }
    });
    
    // 語言切換事件
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      // 初始化當前語言
      languageSelect.value = currentLanguage;
      
      languageSelect.addEventListener('change', async (e) => {
        const selectedLanguage = e.target.value;
        console.log(`🌐 語言已切換為: ${selectedLanguage}`);
        
        // 1. 使用 LanguageManager 更新 URL 參數
        const { LanguageManager } = await import('../i18n/LanguageManager.js');
        LanguageManager.setLanguage(selectedLanguage);
        
        // 2. 自動更新菜單語言（從 i18nService 載入翻譯）
        const translations = await this.loadNavigationTranslations(selectedLanguage);
        this.updateMenuByLanguage(selectedLanguage, translations);
        
        // 3. 調用外部回調（如果提供）
        if (onLanguageChange) {
          onLanguageChange(selectedLanguage);
        }
      });
    }
    
    // 登出按鈕事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('🔓 用戶點擊登出按鈕');
        
        // 獲取翻譯的確認訊息
        const confirmMessage = translations?.navigation?.confirmLogout || '確定要登出嗎？';
        if (!confirm(confirmMessage)) return;

        try {
          // 優先使用外部傳入的回調 onLogout（若有），否則使用內部的 Navigation.handleLogout
          if (typeof onLogout === 'function') {
            await onLogout('work-experience-table');
          } else if (typeof Navigation.handleLogout === 'function') {
            await Navigation.handleLogout('work-experience-table');
          }
        } catch (err) {
          console.error('❌ 登出回調發生錯誤:', err);
        }

        // 顯示登入元件讓使用者重新登入
        try {
          const { LoginComponent } = await import('../components/LoginComponent.js');
          if (LoginComponent && typeof LoginComponent.show === 'function') {
            LoginComponent.show();
          }
        } catch (e) {
          // 忽略動態 import 錯誤（呼叫端可自行處理）
        }
      });
    }
    
    // 菜單項目點擊事件
    const menuItems = document.querySelectorAll('.nav-menu-item');
    if (menuItems.length > 0) {
      menuItems.forEach((item, idx) => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const url = item.getAttribute('data-url');
          Navigation.handleMenuClick(idx, url);
          
          // 手機版點擊菜單後自動收闔
          if (navMenu) {
            navMenu.classList.remove('active');
          }
        });
      });
    }
  }

  /**
   * 根據語言取得菜單項目（多國語系版本）
   * @param {Object} translations - 翻譯物件（來自 i18nService）
   * @returns {Array} 多國語系菜單項目
   */
  static getMenuItemsByLanguage(translations = null) {
    // 定義菜單結構（語言無關的 URL）
    const menuStructure = [
      { key: 'home', url: 'index.html' },
      { key: 'portfolio', url: 'portfolio.html' },
      { key: 'workExperience', url: 'work-experience.html' }
    ];

    // 優先使用提供的翻譯物件
    if (translations && translations.navigation) {
      return menuStructure.map(item => ({
        label: translations.navigation[item.key] || item.key,
        url: item.url
      }));
    }

    // 如果無翻譯，返回空標籤（應由 loadNavigationTranslations 提供）
    return menuStructure.map(item => ({
      label: item.key,
      url: item.url
    }));
  }

  /**
   * 加載導覽列翻譯（直接從 i18nService）
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 導覽列翻譯物件
   */
  static async loadNavigationTranslations(language) {
    try {
      const translations = await i18nService.loadModuleTranslations('navigation', language);
      console.log(`✅ 已載入導覽列翻譯: ${language}`, translations);
      return translations;
    } catch (error) {
      console.error('❌ 載入導覽列翻譯失敗:', error.message);
      return null;
    }
  }

  /**
   * 用翻譯更新菜單（當語言切換時調用）
   * @param {string} language - 新語言代碼
   * @param {Object} translations - 翻譯物件（可選，若不提供則自動載入）
   */
  static async updateMenuByLanguage(language, translations = null) {
    // 如果沒有提供翻譯，自動載入
    let navTranslations = translations;
    if (!navTranslations) {
      navTranslations = await this.loadNavigationTranslations(language);
    }

    const menuItems = this.getMenuItemsByLanguage(navTranslations);
    
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    const menuItemsHTML = menuItems
      .map((item, idx) => `<a href="${item.url}" class="nav-menu-item" data-menu-id="${idx}" data-url="${item.url}">${item.label}</a>`)
      .join('');

    navMenu.innerHTML = menuItemsHTML;

    // 重新綁定菜單點擊事件
    this._bindMenuClickEvents();

    // 更新 i18n 元素（語言標籤、登出按鈕）
    if (navTranslations && navTranslations.navigation) {
      this._updateI18nElements(navTranslations);
    }

    console.log(`✅ 菜單已用 ${language} 語言更新`);
  }

  /**
   * 綁定菜單點擊事件（私有方法）
   * @private
   */
  static _bindMenuClickEvents() {
    const navMenu = document.getElementById('nav-menu');
    const newMenuItems = document.querySelectorAll('.nav-menu-item');
    
    newMenuItems.forEach((item, idx) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const url = item.getAttribute('data-url');
        Navigation.handleMenuClick(idx, url);
        
        if (navMenu) {
          navMenu.classList.remove('active');
        }
      });
    });
  }

  /**
   * 更新 i18n 元素的文字（語言標籤、登出按鈕等）
   * @param {Object} translations - 翻譯物件
   * @private
   */
  static _updateI18nElements(translations) {
    try {
      // 更新語言標籤
      const languageLabel = document.querySelector('.language-label');
      if (languageLabel && translations.navigation?.language) {
        languageLabel.textContent = translations.navigation.language + ':';
      }

      // 更新登出按鈕
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn && translations.navigation?.logout) {
        logoutBtn.textContent = translations.navigation.logout;
      }

      console.log('✅ i18n 元素已更新');
    } catch (err) {
      console.error('❌ _updateI18nElements 發生錯誤:', err);
    }
  }
  
  /**
   * 設定菜單項目為活躍狀態
   * @param {number} index - 菜單項目索引
   */
  static setActiveMenuItem(index) {
    const menuItems = document.querySelectorAll('.nav-menu-item');
    menuItems.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // ============================================
  // 靜態事件處理方法
  // ============================================

  /**
   * 菜單項目點擊處理（靜態方法）
   * @param {number} index - 菜單項目索引
   * @param {string} url - 導航 URL
   */
  static handleMenuClick(index, url = null) {
    console.log(`📌 菜單項目被點擊: ${index}，URL: ${url}`);
    Navigation.setActiveMenuItem(index);
    
    // 導航到指定頁面
    if (url) {
      window.location.href = url;
    }
  }

  /**
   * 登出處理（靜態方法）
   * 
   * @param {string} tableContainerId - 工作經歷表格容器 ID（可選，預設為 'work-experience-table'）
   */
  static async handleLogout(tableContainerId = 'work-experience-table') {
    console.log('🔓 用戶登出');
    
    try {
      // 1. 清除認證資訊和 Cookie
      const { LoginService } = await import('../services/LoginService.js');
      LoginService.logout();
      
      console.log('✅ 登出完成');
      
      // 2. 隱藏主內容和導覽欄（只在 work-experience.html 有效）
      const mainContent = document.querySelector('main');
      const navBar = document.getElementById('navigation');
      const loginScreen = document.getElementById('loginScreen');
      
      if (mainContent) {
        mainContent.style.display = 'none';
      }
      
      if (navBar) {
        navBar.style.display = 'none';
      }
      
      // 3. 顯示登入畫面
      if (loginScreen) {
        loginScreen.style.display = 'flex';
        loginScreen.classList.remove('hidden');
      }
      
      // 4. 重置表格內容（如果容器存在）
      const tableContainer = document.getElementById(tableContainerId);
      if (tableContainer) {
        tableContainer.innerHTML = '';
        console.log('✅ Data 清空');
      }
      
      console.log('✅ 頁面已回到登入畫面');
    } catch (error) {
      console.error('❌ 登出失敗:', error);
    }
  }
}
