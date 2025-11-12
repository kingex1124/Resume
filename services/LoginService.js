/**
 * Login Service Layer
 * 統一管理所有登入相關邏輯：驗證、解密、Cookie、Session 等
 * 專注於登入流程，支援多頁面、多種加密資料
 * 
 * 設計說明：
 * 1. 通用方法：login()、logout()、restoreSession() - 支援任何加密資料
 * 2. 棄用方法：authenticate()、tryAutoDecrypt() - 僅供向後相容
 */

import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { DecryptionService } from './DecryptionService.js';

export class LoginService {
  static #isAuthenticating = false;
  
  // ============================================
  // 通用方法（支援所有頁面）
  // ============================================
  
  /**
   * 通用登入方法 - 支援傳入任何加密資料
   * @param {string} password - 輸入的密碼
   * @param {Object} encryptedData - 加密資料物件
   * @returns {Promise<{success: boolean, data: any, message: string}>} 登入結果
   */
  static async login(password, encryptedData) {
    // 防止重複認證
    if (this.#isAuthenticating) {
      console.log('⏳ 認證已在進行中，請等待...');
      return {
        success: false,
        data: null,
        message: '認證已在進行中，請稍候'
      };
    }

    this.#isAuthenticating = true;

    try {
      // 驗證輸入
      if (!password || !encryptedData) {
        return {
          success: false,
          data: null,
          message: '密碼或資料不能為空'
        };
      }

      // 使用 AuthMiddleware 進行身份驗證並解密
      const result = await AuthMiddleware.authenticate(
        password,
        encryptedData,
        DecryptionService.decryptData.bind(DecryptionService)
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: '登入成功'
        };
      } else {
        return {
          success: false,
          data: null,
          message: result.message || '密碼錯誤或資料損壞'
        };
      }
    } catch (error) {
      console.error('❌ 登入錯誤:', error.message);
      return {
        success: false,
        data: null,
        message: error.message || '發生未知錯誤'
      };
    } finally {
      this.#isAuthenticating = false;
    }
  }

  /**
   * 嘗試從 Cookie 還原會話
   * @param {Object} encryptedData - 加密資料物件
   * @returns {Promise<{success: boolean, data: any, message: string}>} 還原結果
   */
  static async restoreSession(encryptedData) {
    try {
      if (!encryptedData) {
        return {
          success: false,
          data: null,
          message: '加密資料不存在'
        };
      }

      const result = await AuthMiddleware.restoreSessionFromCookie(
        encryptedData,
        DecryptionService.decryptData.bind(DecryptionService)
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
          message: '會話已還原'
        };
      } else {
        return {
          success: false,
          data: null,
          message: '無有效的會話'
        };
      }
    } catch (error) {
      console.error('❌ 還原會話失敗:', error.message);
      return {
        success: false,
        data: null,
        message: error.message || '會話還原失敗'
      };
    }
  }

  /**
   * 通用登出方法
   */
  static logout() {
    try {
      AuthMiddleware.logout();
      return {
        success: true,
        message: '登出成功'
      };
    } catch (error) {
      console.error('❌ 登出失敗:', error.message);
      return {
        success: false,
        message: error.message || '登出失敗'
      };
    }
  }

  /**
   * 檢查是否已登入
   * @returns {boolean} 是否已登入
   */
  static isAuthenticated() {
    try {
      return !!AuthMiddleware.getPassword();
    } catch (error) {
      return false;
    }
  }

  /**
   * 取得當前密碼（用於內部驗證）
   * @returns {string|null} 密碼或 null
   */
  static getStoredPassword() {
    try {
      return AuthMiddleware.getPassword();
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // 工作經歷特定方法（向後相容）
  // ============================================
  
  /**
   * 嘗試自動解密工作經歷資料（使用 Cookie）
   * 注意：此方法已棄用，建議使用 restoreSession(encryptedData)
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} { success, data, needsLogin, message }
   * @deprecated 改用 restoreSession()
   */
  static async tryAutoDecrypt(language = 'zh-TW') {
    console.log('⚠️ tryAutoDecrypt() 已棄用，請改用 restoreSession()');
    return {
      success: false,
      data: null,
      needsLogin: true,
      message: '此方法已棄用'
    };
  }
  
  /**
   * 使用密碼進行登入（解密工作經歷資料）
   * 注意：此方法已棄用，建議使用 login(password, encryptedData)
   * @param {string} password - 使用者輸入的密碼
   * @param {string} language - 語言代碼
   * @returns {Promise<Object>} { success, data, message }
   * @deprecated 改用 login()
   */
  static async authenticate(password, language = 'zh-TW') {
    console.log('⚠️ authenticate() 已棄用，請改用 login()');
    return {
      success: false,
      data: null,
      message: '此方法已棄用'
    };
  }
  
  /**
   * 登出並清除會話
   * @deprecated 改用 logout()
   */
  static legacyLogout() {
    console.log('⚠️ legacyLogout() 已棄用，請改用 logout()');
    AuthMiddleware.logout();
  }
  
  /**
   * 檢查是否已認證（向後相容）
   * @returns {boolean} 是否已認證
   * @deprecated 改用 isAuthenticated()
   */
  static isAuthenticatedLegacy() {
    return this.isAuthenticated();
  }
}
