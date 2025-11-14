/**
 * Index Component
 * 首頁展示元件 - 負責渲染個人簡介、人格特質、標籤等內容
 * 
 * 遵循 ComponentRule 設計規則
 * 支援多語言、響應式設計
 */

export class IndexComponent {
  static #currentLanguage = 'zh-TW';

  /**
   * 初始化首頁元件
   * 
   * @param {Object} options - 初始化選項
   * @param {string} options.containerId - 容器 ID（預設: 'contentArea'）
   * @param {Object} options.data - 首頁資料
   * @param {Object} options.translations - 翻譯資料
   * @returns {Promise<void>}
   */
  static async initialize(options = {}) {
    const { containerId = 'contentArea', data = null, translations = {} } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ 找不到容器: ${containerId}`);
      return;
    }

    try {
      if (!data) {
        container.innerHTML = `<div class="error">❌ 沒有資料可顯示</div>`;
        return;
      }

      // 建構 HTML
      const html = this._buildHTML(data, translations);
      container.innerHTML = html;

      // 綁定事件
      this._bindEvents();

      console.log('✅ 首頁元件初始化完成');
    } catch (error) {
      console.error('❌ 首頁元件初始化失敗:', error);
      container.innerHTML = `<div class="error">載入失敗，請重試</div>`;
    }
  }

  /**
   * 更新語言
   * 
   * @param {string} language - 新語言代碼
   * @param {Object} data - 首頁資料
   * @param {Object} translations - 翻譯資料
   * @returns {Promise<void>}
   */
  static async updateLanguage(language, data, translations) {
    try {
      this.#currentLanguage = language;
      const container = document.getElementById('contentArea');
      if (container) {
        const html = this._buildHTML(data, translations);
        container.innerHTML = html;
        this._bindEvents();
        console.log(`🌐 首頁語言已更新至: ${language}`);
      }
    } catch (error) {
      console.error('❌ 語言更新失敗:', error);
    }
  }

  /**
   * 建構首頁 HTML 結構
   * 
   * @private
   * @param {Object} data - 首頁資料
   * @param {Object} translations - 翻譯資料
   * @returns {string} HTML 字符串
   */
  static _buildHTML(data, translations) {
    const introduction = data?.index?.introduction || '';
    const personality = data?.index?.personality || '';
    const tags = data?.tags || [];

    // 取得翻譯的標籤文字
    const indexTrans = translations?.index || {};
    const introductionLabel = indexTrans.introductionLabel || '📝 個人簡介';
    const personalityLabel = indexTrans.personalityLabel || '✨ 人格特質';
    const tagsLabel = indexTrans.tagsLabel || '🏷️ 特質標籤';

    const sortedTags = [...tags].sort((a, b) => a.sort - b.sort);

    return `
      <div class="index-container">
        <!-- 個人簡介卡片 -->
        <div class="card introduction-card">
          <h2 class="card-title">${this._escapeHTML(introductionLabel)}</h2>
          <div class="card-content introduction-content">
            <p class="introduction-text">${this._escapeHTML(introduction)}</p>
          </div>
        </div>

        <!-- 人格特質卡片 -->
        <div class="card personality-card">
          <h2 class="card-title">${this._escapeHTML(personalityLabel)}</h2>
          <div class="card-content personality-content">
            <p class="personality-text">${this._escapeHTML(personality).replace(/\n/g, '<br>')}</p>
          </div>
        </div>

        <!-- 標籤卡片 -->
        ${this._buildTagsHTML(tagsLabel, sortedTags)}
      </div>
    `;
  }

  /**
   * 建構標籤區塊 HTML
   * 
   * @private
   * @param {string} tagsLabel - 翻譯後的標籤標題
   * @param {Array} tags - 標籤陣列
   * @returns {string} HTML 字符串
   */
  static _buildTagsHTML(tagsLabel, tags) {
    if (!tags || tags.length === 0) {
      return '';
    }

    const tagHTML = tags
      .map(tag => `<span class="tag" data-tag-id="${this._escapeHTML(tag.id)}">${this._escapeHTML(tag.label)}</span>`)
      .join('');

    return `
      <div class="card tags-card">
        <h2 class="card-title">${this._escapeHTML(tagsLabel)}</h2>
        <div class="card-content tags-content">
          <div class="tags-container">
            ${tagHTML}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 綁定事件
   * 
   * @private
   */
  static _bindEvents() {
    // 標籤點擊事件（未來可用於過濾或高亮）
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        const tagId = tag.getAttribute('data-tag-id');
        this._handleTagClick(tagId);
      });
    });
  }

  /**
   * 標籤點擊事件處理
   * 
   * @private
   * @param {string} tagId - 標籤 ID
   */
  static _handleTagClick(tagId) {
    console.log(`📋 標籤被點擊: ${tagId}`);
    // 未來可以新增高亮、過濾等功能
  }

  /**
   * 轉義 HTML 字符，防止 XSS 攻擊
   * 
   * @private
   * @param {string} text - 要轉義的文本
   * @returns {string} 轉義後的文本
   */
  static _escapeHTML(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }
}
