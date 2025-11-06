/**
 * Authentication Middleware Layer
 * 負責處理身份驗證和授權相關的邏輯
 */

export class AuthMiddleware {
  static _isAuthenticated = false;
  static _decryptedData = null;
  static _sessionTimeout = null;
  static _sessionDuration = 30 * 60 * 1000; // 30 分鐘
  
  /**
   * 驗證使用者密碼並解密資料
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
      
      // 2. 嘗試解密
      const decryptResult = await decryptionCallback(password, encryptedData);
      
      if (!decryptResult.success) {
        console.log('❌ 身份驗證失敗');
        this._isAuthenticated = false;
        this._decryptedData = null;
        
        return {
          success: false,
          message: decryptResult.message || '密碼錯誤',
          authenticated: false
        };
      }
      
      // 3. 驗證成功
      console.log('✅ 身份驗證成功');
      this._isAuthenticated = true;
      this._decryptedData = decryptResult.data;
      
      // 4. 設定 session 過期時間
      this._setSessionTimeout();
      
      return {
        success: true,
        message: '身份驗證成功',
        authenticated: true,
        data: decryptResult.data
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
   * 檢查是否已通過身份驗證
   * @returns {boolean} 是否已驗證
   */
  static isAuthenticated() {
    return this._isAuthenticated;
  }
  
  /**
   * 取得已解密的資料
   * @returns {Object|null} 解密的資料或 null
   */
  static getDecryptedData() {
    if (!this._isAuthenticated) {
      console.warn('⚠️ 嘗試在未驗證狀態下取得資料');
      return null;
    }
    return this._decryptedData;
  }
  
  /**
   * 登出並清除 session
   */
  static logout() {
    console.log('👋 使用者登出');
    this._isAuthenticated = false;
    this._decryptedData = null;
    this._clearSessionTimeout();
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
   * 設定 session 持續時間
   * @param {number} duration - 持續時間（毫秒）
   */
  static setSessionDuration(duration) {
    this._sessionDuration = duration;
    if (this._isAuthenticated) {
      this._setSessionTimeout();
    }
  }
  
  /**
   * 取得剩餘 session 時間
   * @returns {number|null} 剩餘時間（毫秒）或 null
   */
  static getRemainingSessionTime() {
    // 這是簡化版本，實際應該記錄開始時間並計算
    return this._isAuthenticated ? this._sessionDuration : null;
  }
  
  /**
   * 驗證資料存取權限
   * @param {string} section - 要存取的資料區段
   * @returns {boolean} 是否有權限存取
   */
  static canAccess(section) {
    if (!this._isAuthenticated) {
      console.warn(`⚠️ 未授權存取: ${section}`);
      return false;
    }
    
    // 可以擴展為更複雜的權限檢查
    return true;
  }
  
  /**
   * 記錄使用者活動（用於延長 session）
   */
  static recordActivity() {
    if (this._isAuthenticated) {
      this.resetSessionTimeout();
    }
  }
}
