import { DataFormatValidator } from '../components/DataFormatValidator.js';

export class ProfileRepository {
  static async loadProfileData(language) {
    const dataPath = this._getDataPath(language);
    try {
      const response = await fetch(dataPath);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      // 檢查是否為加密資料格式
      if (DataFormatValidator.isEncryptedDataFormat(data)) {
        return data;
      }

      // 驗證資料格式
      this._validateProfileData(data);

      return data;
    } catch (error) {
      console.error('❌ 載入失敗:', error.message);
      throw new Error(`Failed to load profile data: ${error.message}`);
    }
  }

  static _getDataPath(language) {
    const paths = {
      'zh-TW': './data/resume-profile-zh-TW.json',
      'ja': './data/resume-profile-ja.json',
      'en': './data/resume-profile-en.json'
    };
    if (!(language in paths)) throw new Error(`Unsupported language: ${language}`);
    return paths[language];
  }

  static _validateProfileData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format: data must be an object');
    }
    
    if (!data.profile || typeof data.profile !== 'object') {
      throw new Error('Invalid data format: missing profile object');
    }

    const requiredProfileFields = ['fullName', 'email'];
    for (const field of requiredProfileFields) {
      if (!(field in data.profile)) {
        throw new Error(`Invalid data format: missing profile.${field}`);
      }
    }

    if (!Array.isArray(data.info)) {
      throw new Error('Invalid data format: info must be an array');
    }

    if (!Array.isArray(data.education)) {
      throw new Error('Invalid data format: education must be an array');
    }

    if (!Array.isArray(data.skills)) {
      throw new Error('Invalid data format: skills must be an array');
    }
  }

  // 取得個人資訊
  static getProfile(data) {
    return data.profile || null;
  }

  // 取得資訊連結（github, linkedin等）
  static getInfoLinks(data) {
    return Array.isArray(data.info) ? data.info : [];
  }

  // 取得教育背景
  static getEducation(data) {
    return Array.isArray(data.education) ? data.education : [];
  }

  // 取得專業技能
  static getSkills(data) {
    if (!Array.isArray(data.skills)) return [];
    // 按 sort 欄位排序
    return data.skills.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  // 取得中繼資訊
  static getMetadata(data) {
    return {
      version: data.version || '1.0',
      lastUpdated: data.lastUpdated || null,
      totalEducations: data.education ? data.education.length : 0,
      totalSkillCategories: data.skills ? data.skills.length : 0
    };
  }
}
