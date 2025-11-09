/**
 * Navigation Component
 * 共用導覽欄元件：包含登出按鈕、導覽菜單、語系切換下拉選單
 */

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
   * @param {Function} options.onMenuClick - 菜單點擊回調函數
   */
  static initialize(options = {}) {
    const {
      containerId = 'navigation',
      menuItems = this._getDefaultMenuItems(),
      languages = [
        { code: 'zh-TW', name: '中文' },
        { code: 'ja', name: '日本語' },
        { code: 'en', name: 'English' }
      ],
      currentLanguage = 'zh-TW',
      onLanguageChange = null,
      onLogout = null,
      onMenuClick = null
    } = options;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ 找不到導覽欄容器: ${containerId}`);
      return;
    }
    
    // 建立導覽欄 HTML
    container.innerHTML = this._buildNavHTML(menuItems, languages);
    
    // 綁定事件
    this._bindEvents({
      languages,
      currentLanguage,
      onLanguageChange,
      onLogout,
      onMenuClick
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
              <label for="language-select" class="language-label">語言:</label>
              <select id="language-select" class="language-dropdown">
                ${languageOptionsHTML}
              </select>
            </div>
            
            <button id="logout-btn" class="logout-button">登出</button>
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
    const { languages, currentLanguage, onLanguageChange, onLogout, onMenuClick } = callbacks;
    
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
      
      languageSelect.addEventListener('change', (e) => {
        const selectedLanguage = e.target.value;
        console.log(`🌐 語言已切換為: ${selectedLanguage}`);
        
        // 自動更新菜單語言（從 work-experience.json 載入翻譯）
        Navigation._loadAndUpdateMenuByLanguage(selectedLanguage);
        
        // 調用外部回調（如果提供）
        if (onLanguageChange) {
          onLanguageChange(selectedLanguage);
        }
      });
    }
    
    // 登出按鈕事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔓 用戶點擊登出按鈕');
        if (confirm('確定要登出嗎？')) {
          Navigation.handleLogout();
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
   * 取得預設菜單項目（中文硬編碼版，已棄用 - 使用 getMenuItemsByLanguage 代替）
   * @returns {Array} 預設菜單項目
   * @private
   */
  static _getDefaultMenuItems() {
    return [
      { label: '首頁', url: 'index.html' },
      { label: '履歷表', url: 'portfolio.html' },
      { label: '工作經歷', url: 'work-experience.html' }
    ];
  }

  /**
   * 根據語言取得菜單項目（多國語系版本）
   * @param {string} language - 語言代碼
   * @param {Object} translations - 翻譯物件（來自 work-experience.json 或 navigation.json）
   * @returns {Array} 多國語系菜單項目
   */
  static getMenuItemsByLanguage(language = 'zh-TW', translations = null) {
    // 定義菜單結構（語言無關的 URL）
    const menuStructure = [
      { key: 'home', url: 'index.html' },
      { key: 'workExperience', url: 'work-experience.html' },
      { key: 'portfolio', url: 'portfolio.html' }
    ];

    // 如果提供了翻譯物件，使用翻譯
    if (translations && translations.navigation) {
      return menuStructure.map(item => ({
        label: translations.navigation[item.key] || item.key,
        url: item.url
      }));
    }

    // 預設多國文本（備用）
    const defaultLabels = {
      'zh-TW': { home: '首頁', workExperience: '工作經歷', portfolio: '作品集' },
      'ja': { home: 'ホーム', workExperience: '職務経歴', portfolio: 'ポートフォリオ' },
      'en': { home: 'Home', workExperience: 'Work Experience', portfolio: 'Portfolio' }
    };

    const labels = defaultLabels[language] || defaultLabels['zh-TW'];

    return menuStructure.map(item => ({
      label: labels[item.key],
      url: item.url
    }));
  }

  /**
   * 用翻譯更新菜單（當語言切換時調用）
   * @param {string} language - 新語言代碼
   * @param {Object} translations - 翻譯物件
   */
  static updateMenuByLanguage(language, translations = null) {
    const menuItems = this.getMenuItemsByLanguage(language, translations);
    
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    const menuItemsHTML = menuItems
      .map((item, idx) => `<a href="${item.url}" class="nav-menu-item" data-menu-id="${idx}" data-url="${item.url}">${item.label}</a>`)
      .join('');

    navMenu.innerHTML = menuItemsHTML;

    // 重新綁定菜單點擊事件
    this._bindMenuClickEvents();

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
   * 從 JSON 檔案載入翻譯並更新菜單（私有方法）
   * @param {string} language - 語言代碼
   * @private
   */
  static async _loadAndUpdateMenuByLanguage(language) {
    try {
      const response = await fetch('./i18n/translations/navigation.json');
      const translations = await response.json();
      
      if (translations && translations[language]) {
        this.updateMenuByLanguage(language, translations[language]);
      } else {
        console.warn(`⚠️ 找不到 ${language} 的菜單翻譯，使用預設`);
        this.updateMenuByLanguage(language, null);
      }
    } catch (error) {
      console.error('❌ 載入菜單翻譯失敗:', error);
      this.updateMenuByLanguage(language, null);
    }
  }
  
  /**
   * 設定當前選中的語言
   * @param {string} languageCode - 語言代碼
   */
  static setCurrentLanguage(languageCode) {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      languageSelect.value = languageCode;
    }
  }
  
  /**
   * 取得當前選中的語言
   * @returns {string} 語言代碼
   */
  static getCurrentLanguage() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      return languageSelect.value;
    }
    return 'zh-TW';
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
  
  /**
   * 更新菜單項目
   * @param {Array} menuItems - 新的菜單項目陣列
   */
  static updateMenuItems(menuItems) {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    const menuItemsHTML = menuItems
      .map((item, idx) => `<a href="#" class="nav-menu-item" data-menu-id="${idx}">${item.label}</a>`)
      .join('');
    
    navMenu.innerHTML = menuItemsHTML;
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
   */
  static handleLogout() {
    console.log('🔓 用戶登出');
    // 清除 localStorage 中的語言設置（可選）
    try {
      localStorage.removeItem('app_language');
    } catch (e) {
      console.warn('⚠️ 無法清除 localStorage');
    }
    // 導航到首頁
    window.location.href = 'index.html';
  }
}
