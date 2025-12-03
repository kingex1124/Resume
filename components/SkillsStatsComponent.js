/**
 * Skills Stats Component
 * 專業技能統計元件 - 顯示所有專案使用技術的進度條
 * 
 * 遵循 ComponentRule 設計規則
 * 支援多語言、響應式設計
 */

import { i18nService } from '../services/i18nService.js';

export class SkillsStatsComponent {
  static #currentLanguage = 'zh-TW';
  static #translationCache = {};

  /**
   * 初始化專業技能統計元件
   * 
   * @param {Object} options - 初始化選項
   * @param {string} options.containerId - 容器 ID
   * @param {Object} options.skillsData - 技能統計資料 { totalProjects, skills: [{ name, count, percentage }] }
   * @param {Object} options.translations - 翻譯資料
   * @returns {Promise<void>}
   */
  static async initialize(options = {}) {
    const { containerId = 'skills-stats-container', skillsData = null, translations = {} } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ 找不到容器: ${containerId}`);
      return;
    }

    try {
      if (!skillsData || !skillsData.skills || skillsData.skills.length === 0) {
        container.innerHTML = '';
        console.log('📊 沒有技能資料可顯示');
        return;
      }

      // 建構 HTML
      const html = this._buildHTML(skillsData, translations);
      container.innerHTML = html;

      // 綁定事件
      this._bindEvents();

      // 延遲啟動動畫
      setTimeout(() => this._animateProgressBars(), 100);

      console.log('✅ 專業技能統計元件初始化完成');
    } catch (error) {
      console.error('❌ 專業技能統計元件初始化失敗:', error);
      container.innerHTML = `<div class="error">載入失敗，請重試</div>`;
    }
  }

  /**
   * 更新語言
   * 
   * @param {string} language - 新語言代碼
   * @param {Object} skillsData - 技能統計資料
   * @param {Object} translations - 翻譯資料
   * @returns {Promise<void>}
   */
  static async updateLanguage(language, skillsData, translations) {
    try {
      this.#currentLanguage = language;
      const container = document.getElementById('skills-stats-container');
      if (container && skillsData && skillsData.skills && skillsData.skills.length > 0) {
        const html = this._buildHTML(skillsData, translations);
        container.innerHTML = html;
        this._bindEvents();
        setTimeout(() => this._animateProgressBars(), 100);
        console.log(`🌐 專業技能統計語言已更新至: ${language}`);
      }
    } catch (error) {
      console.error('❌ 語言更新失敗:', error);
    }
  }

  /**
   * 建構專業技能統計 HTML 結構
   * 
   * @private
   * @param {Object} skillsData - 技能統計資料
   * @param {Object} translations - 翻譯資料
   * @returns {string} HTML 字符串
   */
  static _buildHTML(skillsData, translations) {
    const { totalProjects, skills } = skillsData;

    // 取得翻譯的標籤文字
    const indexTrans = translations?.index || {};
    const skillsStatsLabel = indexTrans.skillsStatsLabel || '💻 專業技能';
    const totalProjectsLabel = indexTrans.totalProjectsLabel || '專案總數';
    const usageLabel = indexTrans.usageLabel || '使用次數';

    // 按使用次數排序（高到低）
    const sortedSkills = [...skills].sort((a, b) => b.count - a.count);

    return `
      <div class="card skills-stats-card">
        <h2 class="card-title">${this._escapeHTML(skillsStatsLabel)}</h2>
        <div class="card-content skills-stats-content">
          <div class="skills-stats-header">
            <span class="total-projects">${this._escapeHTML(totalProjectsLabel)}: <strong>${totalProjects}</strong></span>
          </div>
          <div class="skills-list">
            ${this._buildSkillsListHTML(sortedSkills, usageLabel)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 建構技能列表 HTML
   * 
   * @private
   * @param {Array} skills - 技能陣列
   * @param {string} usageLabel - 使用次數標籤
   * @returns {string} HTML 字符串
   */
  static _buildSkillsListHTML(skills, usageLabel) {
    return skills
      .map((skill, index) => {
        const percentage = Math.round(skill.percentage);
        const hue = this._getColorHue(index, skills.length);
        
        return `
          <div class="skill-item" data-skill="${this._escapeHTML(skill.name)}">
            <div class="skill-header">
              <span class="skill-name">${this._escapeHTML(skill.name)}</span>
              <span class="skill-stats">${skill.count} ${usageLabel} (${percentage}%)</span>
            </div>
            <div class="skill-progress-container">
              <div class="skill-progress-bar" 
                   data-percentage="${percentage}" 
                   style="--progress-color: hsl(${hue}, 70%, 55%); --progress-bg: hsl(${hue}, 70%, 92%);">
                <div class="skill-progress-fill"></div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * 根據索引取得顏色色相值
   * 
   * @private
   * @param {number} index - 技能索引
   * @param {number} total - 技能總數
   * @returns {number} HSL 色相值 (0-360)
   */
  static _getColorHue(index, total) {
    // 使用紫色到藍色的漸層色系（配合主題色 #667eea）
    const baseHue = 250; // 紫藍色基底
    const range = 60; // 色相範圍
    return (baseHue + (index * range / Math.max(total - 1, 1))) % 360;
  }

  /**
   * 綁定事件
   * 
   * @private
   */
  static _bindEvents() {
    // 技能項目懸停效果（未來可擴展為點擊過濾功能）
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.classList.add('skill-item-hover');
      });
      item.addEventListener('mouseleave', () => {
        item.classList.remove('skill-item-hover');
      });
    });
  }

  /**
   * 啟動進度條動畫
   * 
   * @private
   */
  static _animateProgressBars() {
    const progressBars = document.querySelectorAll('.skill-progress-fill');
    progressBars.forEach((bar, index) => {
      const container = bar.closest('.skill-progress-bar');
      const percentage = container?.dataset?.percentage || 0;
      
      // 延遲動畫，產生階梯效果
      setTimeout(() => {
        bar.style.width = `${percentage}%`;
      }, index * 50);
    });
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
    return String(text).replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * 載入翻譯資料
   * 
   * @private
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} 翻譯物件
   */
  static async _loadTranslations(language) {
    const cacheKey = `skills-stats_${language}`;
    if (this.#translationCache[cacheKey]) {
      return this.#translationCache[cacheKey];
    }
    const translations = await i18nService.loadModuleTranslations('index', language);
    this.#translationCache[cacheKey] = translations;
    return translations;
  }
}
