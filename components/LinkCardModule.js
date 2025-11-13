/**
 * Link Card Module
 * 用於在列表項目中解析和渲染純網址內容
 * 只有當文本內容為純網址時才會套用此模組
 */

export class LinkCardModule {
  /**
   * URL 正規表達式 - 匹配以 http:// 或 https:// 開頭的完整 URL
   * @type {RegExp}
   * @private
   */
  static #URL_REGEX = /^https?:\/\/[^\s]+$/;

  /**
   * 檢測文本是否為純網址
   * @param {string} text - 待檢測的文本
   * @returns {boolean} 是否為純網址
   */
  static isPureURL(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return this.#URL_REGEX.test(trimmed);
  }

  /**
   * 從文本中提取網址
   * @param {string} text - 待提取的文本
   * @returns {string|null} 提取的網址或 null
   */
  static extractURL(text) {
    if (!this.isPureURL(text)) return null;
    return text.trim();
  }

  /**
   * 構建 Link Card HTML（同步方法，返回帶 data-url 屬性以便後續非同步更新）
   * @param {string} url - 網址
   * @returns {string} HTML 內容
   * @private
   */
  static _buildLinkCardHTML(url) {
    const host = new URL(url).hostname;
    const favicon = `https://www.google.com/s2/favicons?domain=${host}`;
    const metaTitle = host.replace(/^www\./, '');

    return `
      <a class="link-card" href="${this._escapeHTML(url)}" target="_blank" rel="noopener noreferrer" data-url="${this._escapeHTML(url)}">
        <img src="${this._escapeHTML(favicon)}" alt="favicon" onerror="this.style.display='none'">
        <span class="link-card-title">${metaTitle}</span>
      </a>
    `;
  }

  /**
   * 非同步載入 Link Card 的 metadata（title）
   * @param {HTMLElement} linkCardElement - Link Card 元素
   */
  static async loadLinkCardMetadata(linkCardElement) {
    if (!linkCardElement || !linkCardElement.dataset.url) return;

    const url = linkCardElement.dataset.url;
    const titleSpan = linkCardElement.querySelector('.link-card-title');
    if (!titleSpan) return;

    try {
      const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
      
      if (res.ok) {
        const data = await res.json();
        const title = data?.data?.title || data?.data?.site;
        if (title) {
          titleSpan.textContent = title;
          console.log('✅ 已載入 Link Card metadata:', url);
        }
      }
    } catch (err) {
      console.warn('⚠️ 無法取得 meta.title，使用 fallback。', err.message);
    }
  }

  /**
   * 批量非同步載入所有 Link Card 的 metadata
   * @param {string|HTMLElement} containerOrId - 容器元素或容器 ID
   */
  static async loadAllLinkCardMetadata(containerOrId) {
    let container;

    if (typeof containerOrId === 'string') {
      container = document.getElementById(containerOrId);
      if (!container) {
        console.error(`❌ 找不到容器: ${containerOrId}`);
        return;
      }
    } else if (containerOrId instanceof HTMLElement) {
      container = containerOrId;
    } else {
      return;
    }

    const linkCards = container.querySelectorAll('.link-card[data-url]');
    const promises = Array.from(linkCards).map(card => this.loadLinkCardMetadata(card));
    
    try {
      await Promise.all(promises);
      console.log(`✅ 已載入 ${linkCards.length} 個 Link Card 的 metadata`);
    } catch (err) {
      console.error('❌ 載入 metadata 失敗:', err.message);
    }
  }

  /**
   * 轉義 HTML 特殊字符
   * @param {string} text - 待轉義的文本
   * @returns {string} 轉義後的文本
   * @private
   */
  static _escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 創建 Link Card 元素（帶非同步 metadata 載入）
   * @param {string} url - 網址
   * @param {string} containerId - 容器元素 ID
   */
  static async createLinkCard(url, containerId = 'link-card-container') {
    if (!this.isPureURL(url)) {
      console.warn('⚠️ 不是純網址，跳過 Link Card 建立:', url);
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ 找不到容器: ${containerId}`);
      return;
    }

    try {
      const host = new URL(url).hostname;
      const favicon = `https://www.google.com/s2/favicons?domain=${host}`;
      let metaTitle = host.replace(/^www\./, '');

      // 異步獲取 metadata
      try {
        const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
        const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
        
        if (res.ok) {
          const data = await res.json();
          metaTitle = data?.data?.title || data?.data?.site || metaTitle;
        }
      } catch (err) {
        console.warn('⚠️ 無法取得 meta.title，使用 fallback。', err.message);
      }

      // 構建並插入 HTML
      const html = `
        <a class="link-card" href="${this._escapeHTML(url)}" target="_blank" rel="noopener noreferrer">
          <img src="${this._escapeHTML(favicon)}" alt="favicon" onerror="this.style.display='none'">
          <span>${this._escapeHTML(metaTitle)}</span>
        </a>
      `;

      container.innerHTML = html;
      console.log('✅ Link Card 建立成功:', url);
    } catch (error) {
      console.error('❌ Link Card 建立失敗:', error.message);
    }
  }

  /**
   * 獲取 CSS 樣式
   * @returns {string} CSS 樣式字符串
   */
  static getStyles() {
    return `
      .link-card {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 2px 8px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        text-decoration: none;
        color: #111827;
        font-family: "Segoe UI", "Noto Sans TC", sans-serif;
        font-size: 15px;
        transition: all 0.25s ease;
      }

      .link-card:hover {
        border-color: #d1d5db;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        transform: translateY(-1px);
        background: #f9fafb;
      }

      .link-card img {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .link-card span {
        font-weight: 500;
        white-space: nowrap;
      }
    `;
  }

  /**
   * 在文檔中注入 CSS 樣式
   * @param {string} styleId - style 標籤的 ID
   */
  static injectStyles(styleId = 'link-card-styles') {
    // 檢查是否已經注入
    if (document.getElementById(styleId)) {
      console.log('✅ Link Card 樣式已存在');
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = this.getStyles();
    document.head.appendChild(styleElement);
    console.log('✅ Link Card 樣式已注入');
  }
}
