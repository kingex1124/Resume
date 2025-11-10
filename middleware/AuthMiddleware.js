/**
 * Authentication Middleware Layer
 * 負責處理身份驗證和授權相關的邏輯
 */

export class AuthMiddleware {
  static _isAuthenticated = false;
  static _password = null; // 只儲存密碼
  static _sessionTimeout = null;
  static _sessionExpirySeconds = 30 * 60; // 30 分鐘（秒）
  static _cookieName = 'authPassword';
  static get _cookieOptions() {
    return `max-age=${this._sessionExpirySeconds};path=/;samesite=strict`;
  }
  static get _sessionDuration() {
    return this._sessionExpirySeconds * 1000; // 毫秒
  }
  
  /**
   * 驗證使用者密碼並解密資料（只儲存密碼，不儲存解密結果）
   * @param {string} password - 使用者輸入的密碼
   * @param {Object} encryptedData - 加密的資料
   * @param {Function} decryptionCallback - 解密回調函數
   * @returns {Promise<Object>} 驗證結果
   */
  static async authenticate(password, encryptedData, decryptionCallback) {
    try {
      console.log('🔐 開始身份驗證...');
      
      // 1. 驗證輸入
      if (!password || password.trim().length === 0) {
        return {
          success: false,
          message: '請輸入密碼',
          authenticated: false
        };
      }
      
      // 2. 嘗試解密驗證密碼
      const decryptResult = await decryptionCallback(password, encryptedData);
      
      if (!decryptResult.success) {
        console.log('❌ 身份驗證失敗');
        this._isAuthenticated = false;
        this._password = null;
        
        return {
          success: false,
          message: decryptResult.message || '密碼錯誤',
          authenticated: false
        };
      }
      
      // 3. 驗證成功 - 只儲存密碼，不儲存解密資料
      console.log('✅ 身份驗證成功');
      this._isAuthenticated = true;
      this._password = password;
      
      // 4. 儲存密碼到 cookie
      this._setPasswordCookie(password);
      
      // 5. 設定 session 過期時間
      this._setSessionTimeout();
      
      return {
        success: true,
        message: '身份驗證成功',
        authenticated: true,
        data: decryptResult.data // 只回傳本次解密結果，不永久儲存
      };
      
    } catch (error) {
      console.error('❌ 身份驗證錯誤:', error.message);
      return {
        success: false,
        message: `驗證失敗: ${error.message}`,
        authenticated: false
      };
    }
  }
  
  /**
   * 嘗試從 cookie 還原密碼並重新解密
   * @param {Object} encryptedData - 加密的資料
   * @param {Function} decryptionCallback - 解密回調函數
   * @returns {Promise<Object>} 復原結果
   */
  static async restoreSessionFromCookie(encryptedData, decryptionCallback) {
    try {
      const password = this._getPasswordFromCookie();
      
      if (!password) {
        console.log('📭 Cookie 中無密碼，需重新登入');
        return {
          success: false,
          message: 'Cookie 中無有效密碼',
          authenticated: false
        };
      }
      
      console.log('🔄 從 Cookie 復原會話，重新解密資料...');
      
      // 使用 cookie 中的密碼重新解密
      const decryptResult = await decryptionCallback(password, encryptedData);
      
      if (!decryptResult.success) {
        console.log('❌ Cookie 密碼無效');
        this._clearPasswordCookie();
        this._isAuthenticated = false;
        this._password = null;
        
        return {
          success: false,
          message: 'Cookie 密碼已過期或無效',
          authenticated: false
        };
      }
      
      // 密碼有效，恢復認證狀態（但不存儲解密資料）
      console.log('✅ 會話復原成功');
      this._isAuthenticated = true;
      this._password = password;
      this._setSessionTimeout();
      
      return {
        success: true,
        message: '會話復原成功',
        authenticated: true,
        data: decryptResult.data // 只回傳本次解密結果
      };
      
    } catch (error) {
      console.error('❌ 會話復原失敗:', error.message);
      this._clearPasswordCookie();
      this._isAuthenticated = false;
      this._password = null;
      
      return {
        success: false,
        message: `會話復原失敗: ${error.message}`,
        authenticated: false
      };
    }
  }
  
  /**
   * 檢查是否已通過身份驗證
   * @returns {boolean} 是否已驗證
   */
  static isAuthenticated() {
    return this._isAuthenticated;
  }
  
  /**
   * 取得已儲存的密碼（用於重新解密）
   * @returns {string|null} 儲存的密碼或 null
   */
  static getPassword() {
    if (!this._isAuthenticated) {
      console.warn('⚠️ 嘗試在未驗證狀態下取得密碼');
      return null;
    }
    return this._password;
  }
  
  /**
   * 登出並清除 session
   */
  static logout() {
    console.log('👋 使用者登出');
    this._isAuthenticated = false;
    this._password = null;
    this._clearPasswordCookie();
    this._clearSessionTimeout();
    console.log('✅ 認證狀態已清除');
  }
  
  /**
   * 重設 session 過期時間
   */
  static resetSessionTimeout() {
    if (this._isAuthenticated) {
      console.log('🔄 重設 session 時間');
      this._setSessionTimeout();
    }
  }
  
  /**
   * 設定 session 過期時間
   * @private
   */
  static _setSessionTimeout() {
    // 清除舊的 timeout
    this._clearSessionTimeout();
    
    // 設定新的 timeout
    this._sessionTimeout = setTimeout(() => {
      console.log('⏰ Session 已過期');
      this.logout();
      
      // 觸發 session 過期事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sessionExpired', {
          detail: { message: 'Session 已過期，請重新登入' }
        }));
      }
    }, this._sessionDuration);
  }
  
  /**
   * 清除 session timeout
   * @private
   */
  static _clearSessionTimeout() {
    if (this._sessionTimeout) {
      clearTimeout(this._sessionTimeout);
      this._sessionTimeout = null;
    }
  }
  
  /**
   * 記錄使用者活動（用於延長 session）
   */
  static recordActivity() {
    if (this._isAuthenticated) {
      this.resetSessionTimeout();
    }
  }
  
  /**
   * 設定密碼到 cookie
   * @param {string} password - 密碼
   * @private
   */
  static _setPasswordCookie(password) {
    try {
      document.cookie = `${this._cookieName}=${encodeURIComponent(password)};${this._cookieOptions}`;
      console.log('✅ 密碼已儲存到 cookie');
    } catch (error) {
      console.error('❌ 無法儲存密碼到 cookie:', error.message);
    }
  }
  
  /**
   * 從 cookie 取得密碼
   * @returns {string|null} 密碼或 null
   * @private
   */
  static _getPasswordFromCookie() {
    try {
      const name = `${this._cookieName}=`;
      const decodedCookie = decodeURIComponent(document.cookie);
      const cookieArray = decodedCookie.split(';');
      
      for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.startsWith(name)) {
          const password = cookie.substring(name.length);
          console.log('✅ 已從 cookie 取得密碼');
          return password;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ 無法從 cookie 取得密碼:', error.message);
      return null;
    }
  }
  
  /**
   * 清除 cookie 中的密碼
   * @private
   */
  static _clearPasswordCookie() {
    try {
      // 方法 1: 設定 max-age=0
      document.cookie = `${this._cookieName}=;max-age=0;path=/;samesite=strict`;
      
      // 方法 2: 設定過期日期為過去
      document.cookie = `${this._cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
      
      // 方法 3: 用各種路徑嘗試清除（以防多層路徑問題）
      document.cookie = `${this._cookieName}=;max-age=0;path=/;`;
      
      console.log('✅ Cookie 已清除');
    } catch (error) {
      console.error('❌ 無法清除 cookie:', error.message);
    }
  }
}
