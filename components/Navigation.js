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
      .map((item, idx) => `<a href="#" class="nav-menu-item" data-menu-id="${idx}">${item.label}</a>`)
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
    const { languages, onLanguageChange, onLogout, onMenuClick } = callbacks;
    
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
    if (languageSelect && onLanguageChange) {
      languageSelect.addEventListener('change', (e) => {
        const selectedLanguage = e.target.value;
        console.log(`🌐 語言已切換為: ${selectedLanguage}`);
        onLanguageChange(selectedLanguage);
      });
    }
    
    // 登出按鈕事件
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && onLogout) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔓 用戶點擊登出按鈕');
        if (confirm('確定要登出嗎？')) {
          onLogout();
        }
      });
    }
    
    // 菜單項目點擊事件
    const menuItems = document.querySelectorAll('.nav-menu-item');
    if (menuItems.length > 0 && onMenuClick) {
      menuItems.forEach((item, idx) => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          console.log(`📌 菜單項目被點擊: ${idx}`);
          onMenuClick(idx, item.getAttribute('data-menu-id'));
          
          // 手機版點擊菜單後自動收闔
          if (navMenu) {
            navMenu.classList.remove('active');
          }
        });
      });
    }
  }
  
  /**
   * 取得預設菜單項目
   * @returns {Array} 預設菜單項目
   * @private
   */
  static _getDefaultMenuItems() {
    return [
      { label: '首頁', url: 'index.html' },
      { label: '工作經歷', url: 'work-experience.html' },
      { label: '作品集', url: 'portfolio.html' }
    ];
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
}
