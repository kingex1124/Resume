/**
 * Work Experience Modal Component
 * 階層式對話框元件：支援 parent 詳情、child 詳情等多層級
 */

export class WorkExperienceModal {
  static currentStack = []; // 對話框堆疊，儲存 { type, content }

  /**
   * 初始化模態框
   * @param {Object} options - 配置選項
   * @param {string} options.containerId - 容器元素 ID
   * @param {Function} options.onClose - 關閉回調
   */
  static initialize(options = {}) {
    const { containerId = 'modal-container', onClose = null } = options;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`找不到模態框容器: ${containerId}`);
      return;
    }
    
    // 建立模態框 HTML
    container.innerHTML = `
      <div id="modal-overlay" class="modal-overlay hidden"></div>
      <div id="modal-container-inner" class="modal-container hidden"></div>
    `;
    
    this._bindModalEvents(onClose);
    console.log('模態框初始化完成');
  }

  /**
   * 顯示 Parent 工作經歷詳情對話框
   * @param {Object} parentData - Parent 工作經歷物件
   * @param {Array} childProjects - 子專案陣列
   * @param {Function} onChildClick - Child 項目點擊回調
   */
  static showParentModal(parentData, childProjects = [], onChildClick = null) {
    const modalContent = this._buildParentModalContent(parentData, childProjects, onChildClick);
    this._displayModal(modalContent, 'parent');
    
    // 綁定 child 專案點擊事件
    if (onChildClick) {
      this._bindChildProjectClickEvents(childProjects, onChildClick);
    }
  }

  /**
   * 顯示 Child 專案詳情對話框
   * @param {Object} projectData - Child 專案物件
   */
  static showChildModal(projectData) {
    const modalContent = this._buildChildModalContent(projectData);
    this._displayModal(modalContent, 'child');
  }

  /**
   * 建立 Parent 模態框 HTML
   * @param {Object} parentData - Parent 資料
   * @param {Array} childProjects - Child 專案陣列
   * @param {Function} onChildClick - Child 點擊回調
   * @returns {string} HTML 內容
   * @private
   */
  static _buildParentModalContent(parentData, childProjects, onChildClick) {
    const projectTableRows = childProjects
      .map((project, idx) => {
        const periodText = this._formatMultiplePeriods(project.periods || []);
        return `
          <tr class="child-project-row" data-project-idx="${idx}">
            <td>${periodText}</td>
            <td><span class="clickable-text">${project.name}</span></td>
            <td>${project.role}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <div class="modal-content parent-modal">
        <div class="modal-header">
          <h2>${parentData.company.name}</h2>
          <button class="modal-close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="modal-info-section">
            <div class="info-row">
              <label>期間:</label>
              <span>${this._formatPeriodText(parentData.period)}</span>
            </div>
            <div class="info-row">
              <label>工作天數:</label>
              <span>${parentData.workingDays || 'N/A'}</span>
            </div>
            <div class="info-row">
              <label>職務內容:</label>
              <span>${parentData.summary}</span>
            </div>
          </div>
          
          <div class="modal-projects-section">
            <h3>專案清單</h3>
            <table class="projects-table">
              <thead>
                <tr>
                  <th>期間</th>
                  <th>專案名稱</th>
                  <th>角色職責</th>
                </tr>
              </thead>
              <tbody>
                ${projectTableRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 建立 Child 模態框 HTML
   * @param {Object} projectData - Child 專案物件
   * @returns {string} HTML 內容
   * @private
   */
  static _buildChildModalContent(projectData) {
    const contentHTML = this._buildContentSections(projectData.details?.content?.sections || []);

    return `
      <div class="modal-content child-modal">
        <div class="modal-header">
          <h2>${projectData.name}</h2>
          <button class="modal-close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="modal-info-section">
            <div class="info-row">
              <label>期間:</label>
              <span>${this._formatMultiplePeriods(projectData.periods || []).replace(/\n/g, '<br>')}</span>
            </div>
            <div class="info-row">
              <label>工作天數:</label>
              <span>${projectData.details?.overview?.workingDays || 'N/A'}</span>
            </div>
            <div class="info-row">
              <label>職務角色:</label>
              <span>${projectData.role}</span>
            </div>
          </div>
          
          <div class="modal-content-section">
            ${contentHTML}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 建立內容區塊 HTML
   * @param {Array} sections - 內容區塊陣列
   * @returns {string} HTML 內容
   * @private
   */
  static _buildContentSections(sections) {
    return sections
      .map(section => this._buildContentSection(section))
      .join('');
  }

  /**
   * 建立單一區塊
   * @param {Object} section - 區塊物件
   * @returns {string} HTML
   * @private
   */
  static _buildContentSection(section) {
    switch (section.type) {
      case 'heading':
        const headingTag = `h${section.level || 2}`;
        return `<${headingTag}>${section.text}</${headingTag}>`;
        
      case 'list':
        return this._buildListSection(section.items || []);
        
      case 'table':
        return this._buildTableSection(section);
        
      case 'image':
        return `<img src="${section.url}" alt="${section.alt}" class="content-image">`;
        
      default:
        return '';
    }
  }

  /**
   * 建立清單區塊
   * @param {Array} items - 清單項目
   * @returns {string} HTML
   * @private
   */
  static _buildListSection(items) {
    const html = items
      .map(item => {
        const bullet = this._getBulletByLevel(item.level);
        const indent = `margin-left: ${(item.level - 1) * 20}px`;
        return `<li style="${indent}"><span class="bullet">${bullet}</span> ${item.text}</li>`;
      })
      .join('');
    
    return `<ul class="content-list">${html}</ul>`;
  }

  /**
   * 根據層級取得項目符號
   * @param {number} level - 層級
   * @returns {string} 項目符號
   * @private
   */
  static _getBulletByLevel(level) {
    const bullets = ['●', '○', '■', '◇'];
    return bullets[level - 1] || bullets[0];
  }

  /**
   * 建立表格區塊
   * @param {Object} section - 表格區塊物件
   * @returns {string} HTML
   * @private
   */
  static _buildTableSection(section) {
    const headerRows = section.hasHeaders && section.headers
      ? `<tr>${section.headers.map(h => `<th>${h}</th>`).join('')}</tr>`
      : '';
    
    const bodyRows = section.rows
      .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
      .join('');
    
    return `
      <table class="content-table">
        <thead>${headerRows}</thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;
  }

  /**
   * 顯示模態框
   * @param {string} content - HTML 內容
   * @param {string} type - 模態框類型
   * @private
   */
  static _displayModal(content, type) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container-inner');
    
    if (!overlay || !container) return;
    
    // 儲存當前內容到堆疊
    this.currentStack.push({ type, content });
    
    container.innerHTML = content;
    overlay.classList.remove('hidden');
    container.classList.remove('hidden');
    
    this._bindModalEvents();
  }

  /**
   * 關閉模態框
   */
  static closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container-inner');
    
    if (!overlay || !container) return;
    
    // 移除堆疊的最上層
    if (this.currentStack.length > 0) {
      this.currentStack.pop();
    }
    
    // 如果堆疊還有內容，顯示上一層
    if (this.currentStack.length > 0) {
      const previousModal = this.currentStack[this.currentStack.length - 1];
      container.innerHTML = previousModal.content;
      this._bindModalEvents();
      console.log(`📋 回到上一層對話框: ${previousModal.type}`);
    } else {
      // 堆疊為空，隱藏對話框
      overlay.classList.add('hidden');
      container.classList.add('hidden');
      container.innerHTML = '';
      console.log('📋 所有對話框已關閉');
    }
  }

  /**
   * 綁定 child 專案點擊事件
   * @param {Array} childProjects - 子專案陣列
   * @param {Function} onChildClick - 回調函數
   * @private
   */
  static _bindChildProjectClickEvents(childProjects, onChildClick) {
    const projectRows = document.querySelectorAll('.child-project-row');
    
    projectRows.forEach((row, idx) => {
      const clickableText = row.querySelector('.clickable-text');
      
      if (clickableText) {
        clickableText.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          console.log(`📋 Child 專案被點擊: ${childProjects[idx].name}`);
          
          // 顯示 child 詳情模態框
          this.showChildModal(childProjects[idx]);
        });
        
        clickableText.style.cursor = 'pointer';
      }
    });
  }

  /**
   * 綁定模態框事件
   * @param {Function} onClose - 關閉回調
   * @private
   */
  static _bindModalEvents(onClose = null) {
    const closeBtn = document.querySelector('.modal-close-btn');
    const overlay = document.getElementById('modal-overlay');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
    
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal();
        }
      });
    }
  }

  /**
   * 格式化期間文本
   * @param {Object} period - 期間物件
   * @returns {string} 格式化文本
   * @private
   */
  static _formatPeriodText(period) {
    if (!period) return '';
    const { start, end, duration } = period;
    return `${start} ~ ${end} (${duration})`;
  }

  /**
   * 格式化多個期間文本
   * @param {Array} periods - 期間陣列
   * @returns {string} 格式化文本
   * @private
   */
  static _formatMultiplePeriods(periods) {
    if (!periods || periods.length === 0) return '';
    
    return periods
      .map(period => this._formatPeriodText(period))
      .join('\n');
  }
}
