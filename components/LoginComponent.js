/**
 * Login Component
 * 登入畫面獨立元件，支援多頁面重用
 * 套用 login-screen.css 樣式
 */

export class LoginComponent {
  /**
   * 初始化登入畫面
   * @param {Object} options - 配置選項
   * @param {string} options.containerId - 容器元素 ID（預設: 'loginScreen'）
   * @param {string} options.defaultPassword - 預設密碼提示文字
   * @param {Function} options.onLogin - 登入成功回調函數 (password) => {}
   * @param {Function} options.onCancel - 取消登入回調函數
   */
  static initialize(options = {}) {
    const {
      containerId = 'loginScreen',
      defaultPassword = 'mySecurePassword123',
      onLogin = null,
      onCancel = null
    } = options;

    this.containerId = containerId;
    this.onLogin = onLogin;
    this.onCancel = onCancel;
    this.defaultPassword = defaultPassword;

    // 建立登入畫面 HTML
    this._buildLoginScreen();

    // 綁定事件
    this._bindEvents();
    // 先隱藏起來。
    this.hide();
    
    console.log('✅ 登入組件初始化完成');
  }

  /**
   * 建立登入畫面 HTML
   * @private
   */
  static _buildLoginScreen() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`❌ 找不到登入容器: ${this.containerId}`);
      return;
    }

    container.innerHTML = `
      <div class="login-box">
        <div class="lock-icon">🔒</div>
        <h1>個人履歷</h1>
        <p>此內容已加密保護，請輸入密碼以檢視</p>
        
        <div class="input-group">
          <label for="passwordInput">密碼</label>
          <input 
            type="password" 
            id="passwordInput" 
            placeholder="請輸入密碼"
            autocomplete="current-password"
          >
        </div>
        
        <button class="btn" id="loginBtn">解鎖並檢視</button>
        
        <div class="error-message" id="errorMessage"></div>
        
      </div>
    `;
  }

  /**
   * 綁定事件監聽器
   * @private
   */
  static _bindEvents() {
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.handleLogin();
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleLogin();
        }
      });
    }
  }

  /**
   * 登入處理
   * @private
   */
  static async handleLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    if (!passwordInput) return;

    const password = passwordInput.value;

    if (!password) {
      this.showError('請輸入密碼');
      return;
    }

    // 顯示載入狀態
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = '解密中...';
    }
    if (errorMessage) {
      errorMessage.classList.remove('show');
    }

    try {
      // 調用外部登入回調
      if (this.onLogin) {
        await this.onLogin(password);
      }
    } catch (error) {
      this.showError('登入失敗: ' + error.message);
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = '解鎖並檢視';
      }
    }
  }

  /**
   * 顯示錯誤訊息
   * @param {string} message - 錯誤訊息
   */
  static showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.add('show');
    }
  }

  /**
   * 清除錯誤訊息
   */
  static clearError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
      errorMessage.classList.remove('show');
      errorMessage.textContent = '';
    }
  }

  /**
   * 顯示/隱藏載入中狀態
   * @param {boolean} show - 是否顯示載入狀態
   */
  static showLoading(show) {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.disabled = show;
      loginBtn.textContent = show ? '解密中...' : '解鎖並檢視';
    }
  }

  /**
   * 顯示登入畫面
   */
  static show() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.style.display = 'flex';
      container.classList.remove('hidden');
    }
  }

  /**
   * 隱藏登入畫面
   */
  static hide() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.classList.add('hidden');
      // 使用 !important 確保覆蓋 CSS 中的 display: flex
      container.style.display = 'none !important';
    }
  }

  /**
   * 重設登入表單
   */
  static reset() {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
      passwordInput.value = '';
    }
    this.clearError();
  }

  /**
   * 獲取輸入的密碼
   * @returns {string} 密碼值
   */
  static getPassword() {
    const passwordInput = document.getElementById('passwordInput');
    return passwordInput ? passwordInput.value : '';
  }

  /**
   * 設定密碼輸入框焦點
   */
  static focus() {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
      passwordInput.focus();
    }
  }
}
