/**
 * Loading And Error Component
 * 處理載入狀態和錯誤訊息的共用元件
 */

export class LoadingAndErrorComponent {
  /**
   * 顯示/隱藏載入中狀態
   * @param {boolean} show - 是否顯示
   * @param {string} containerId - 容器 ID (預設為 'loading')
   */
  static showLoading(show = true, containerId = 'loading') {
    const loadingEl = document.getElementById(containerId);
    if (loadingEl) {
      loadingEl.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * 隱藏載入中狀態
   * @param {string} containerId - 容器 ID (預設為 'loading')
   */
  static hideLoading(containerId = 'loading') {
    this.showLoading(false, containerId);
  }

  /**
   * 顯示錯誤訊息
   * @param {string} title - 錯誤標題
   * @param {string} message - 錯誤訊息
   * @param {string} containerId - 容器 ID (預設為 'error-container')
   */
  static showError(title = '', message = '', containerId = 'error-container') {
    const errorContainer = document.getElementById(containerId);
    if (!errorContainer) return;

    if (!title && !message) {
      errorContainer.innerHTML = '';
      return;
    }

    errorContainer.innerHTML = `
      <div class="error">
        <div class="error-title">❌ ${title}</div>
        <div>${message}</div>
      </div>
    `;
  }

  /**
   * 清除錯誤訊息
   * @param {string} containerId - 容器 ID (預設為 'error-container')
   */
  static clearError(containerId = 'error-container') {
    this.showError('', '', containerId);
  }
}
