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
          const displayName = this._getRowDisplayName(rowData) || text.textContent || '';

          this._trackGA(displayName);
          
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
   * 將點擊事件標記到 GA
   * @param {string} name - 事件名稱
   * @param {string} pageType - 頁面類型
   * @private
   */
  static _trackGA(name, pageType = 'work-experience') {
    if (typeof window === 'undefined' || typeof window.tagGAEvent !== 'function') return;
    window.tagGAEvent(name, pageType);
  }

  /**
   * 取得行顯示名稱
   * @param {Object} rowData - 行資料
   * @returns {string} 顯示名稱
   * @private
   */
  static _getRowDisplayName(rowData) {
    if (!rowData || !rowData.data) return '';
    if (rowData.type === 'parent') {
      return rowData.data.company?.name || '';
    }
    if (rowData.type === 'child') {
      return rowData.data.name || '';
    }
    return '';
  }
}
