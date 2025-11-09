/**
 * Work Experience Table Component
 * 主表格 UI 元件：顯示工作經歷主表 (parent 和 child 混合)
 */

export class WorkExperienceTable {
  /**
   * 初始化工作經歷表格
   * @param {Object} options - 配置選項
   * @param {string} options.containerId - 容器元素 ID
   * @param {Array} options.rows - 表格行資料
   * @param {Function} options.onRowClick - 行點擊回調函數
   * @param {Object} options.translations - 翻譯物件
   */
  static initialize(options = {}) {
    const {
      containerId = 'work-experience-table',
      rows = [],
      onRowClick = null,
      translations = this._getDefaultTranslations()
    } = options;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ 找不到表格容器: ${containerId}`);
      return;
    }
    
    // 建立表格 HTML
    container.innerHTML = this._buildTableHTML(rows, translations);
    
    // 綁定事件
    if (onRowClick) {
      this._bindRowClickEvents(rows, onRowClick);
    }
    
    console.log('✅ 工作經歷表格初始化完成');
  }
  
  /**
   * 建立表格 HTML 結構
   * @param {Array} rows - 表格行資料
   * @param {Object} translations - 翻譯文本
   * @returns {string} HTML 字串
   * @private
   */
  static _buildTableHTML(rows, translations) {
    const tableRows = rows
      .map((row, idx) => this._buildTableRow(row, idx, translations))
      .join('');
    
    return `
      <div class="work-experience-table-wrapper">
        <h2 class="table-title">${translations.title || '工作經歷'}</h2>
        
        <table class="work-experience-table">
          <thead>
            <tr>
              <th>${translations.period || '期間'}</th>
              <th>${translations.project || '專案/項目'}</th>
              <th>${translations.role || '職務/內容'}</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }
  
  /**
   * 建立單一表格行
   * @param {Object} row - 行資料
   * @param {number} idx - 行索引
   * @param {Object} translations - 翻譯文本
   * @returns {string} 行 HTML
   * @private
   */
  static _buildTableRow(row, idx, translations) {
    const { type, data } = row;
    
    if (type === 'parent') {
      return `
        <tr class="table-row parent-row" data-row-index="${idx}" data-type="parent" data-id="${data.id}">
          <td class="period-cell parent-text">${this._formatParentPeriod(data.period)}</td>
          <td class="project-cell">
            <span class="clickable-text">${data.company.name}</span>
          </td>
          <td class="role-cell parent-text">${data.summary}</td>
        </tr>
      `;
    } else if (type === 'child') {
      return `
        <tr class="table-row child-row" data-row-index="${idx}" data-type="child" data-id="${data.id}">
          <td class="period-cell">
            ${this._formatMultiplePeriods(data.periods)}
          </td>
          <td class="project-cell">
            <span class="clickable-text">${data.name}</span>
          </td>
          <td class="role-cell">${data.role}</td>
        </tr>
      `;
    }
    
    return '';
  }
  
  /**
   * 格式化 Parent 期間顯示（不折行）
   * @param {Object} period - 期間物件
   * @returns {string} HTML 字串
   * @private
   */
  static _formatParentPeriod(period) {
    if (!period) return '';
    const { start, end, duration } = period;
    const durationText = duration && duration.trim() ? ` (${duration})` : '';
    return `<span class="period-date">${start}~${end}${durationText}</span>`;
  }
  
  /**
   * 格式化期間顯示
   * @param {Object} period - 期間物件
   * @returns {string} HTML 字串
   * @private
   */
  static _formatPeriod(period) {
    if (!period) return '';
    const { start, end, duration } = period;
    const durationText = duration && duration.trim() ? ` (${duration})` : '';
    return `<span class="period-date">${start}</span><br><span class="period-date">~</span><br><span class="period-date">${end}${durationText}</span>`;
  }
  
  /**
   * 格式化多個期間顯示折行
   * @param {Array} periods - 期間陣列
   * @returns {string} HTML 字串
   * @private
   */
  static _formatMultiplePeriods(periods) {
    if (!periods || periods.length === 0) return '';
    
    return periods
      .map(period => {
        const { start, end, duration } = period;
        const durationText = duration && duration.trim() ? ` (${duration})` : '';
        return `<span class="period-date">${start}~${end}${durationText}</span>`;
      })
      .join('<br>');
  }
  
  /**
   * 綁定表格行點擊事件
   * @param {Array} rows - 表格行資料
   * @param {Function} onRowClick - 點擊回調函數
   * @private
   */
  static _bindRowClickEvents(rows, onRowClick) {
    const tableRows = document.querySelectorAll('.table-row');
    
    tableRows.forEach((tr, idx) => {
      const clickableTexts = tr.querySelectorAll('.clickable-text');
      
      clickableTexts.forEach(text => {
        text.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const rowType = tr.getAttribute('data-type');
          const rowId = tr.getAttribute('data-id');
          const rowData = rows[idx];
          
          console.log(`📋 行被點擊: 類型=${rowType}, ID=${rowId}`);
          onRowClick({
            type: rowType,
            id: rowId,
            data: rowData,
            index: idx
          });
        });
        
        // 添加指標效果
        text.style.cursor = 'pointer';
      });
    });
  }
  
  /**
   * 更新表格內容
   * @param {Array} rows - 新的表格行資料
   * @param {Object} translations - 翻譯文本
   */
  static updateTable(rows, translations = this._getDefaultTranslations()) {
    const wrapper = document.querySelector('.work-experience-table-wrapper');
    if (!wrapper) return;
    
    wrapper.innerHTML = this._buildTableHTML(rows, translations).replace(
      '<div class=\"work-experience-table-wrapper\">',
      ''
    ).replace(
      '</div>',
      ''
    );
  }
  
  /**
   * 取得預設翻譯
   * @returns {Object} 翻譯文本
   * @private
   */
  static _getDefaultTranslations() {
    return {
      title: '工作經歷',
      period: '期間',
      project: '專案/項目',
      role: '職務/內容'
    };
  }
  
  /**
   * 設定表格樣式主題
   * @param {string} theme - 主題名稱 light 或 dark
   */
  static setTheme(theme = 'light') {
    const wrapper = document.querySelector('.work-experience-table-wrapper');
    if (!wrapper) return;
    
    wrapper.classList.remove('theme-light', 'theme-dark');
    wrapper.classList.add(`theme-${theme}`);
  }
}
