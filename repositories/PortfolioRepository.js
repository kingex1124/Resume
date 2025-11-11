import { DataFormatValidator } from '../components/DataFormatValidator.js';

export class PortfolioRepository {
  static async loadPortfolioData(language) {
    const dataPath = this._getDataPath(language);
    try {
      const response = await fetch(dataPath);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      // 檢查是否為加密資料格式
      if (DataFormatValidator.isEncryptedDataFormat(data)) {
        console.log('🔐 偵測到加密資料格式，直接返回');
        return data;
      }

      // 驗證資料格式
      this._validatePortfolioData(data);

      console.log('✅ 履歷作品集資料載入成功');
      return data;
    } catch (error) {
      console.error('❌ 載入失敗:', error.message);
      throw new Error(`Failed to load portfolio data: ${error.message}`);
    }
  }

  static _getDataPath(language) {
    const paths = {
      'zh-TW': './data/resume-portfolio-zh-TW.json',
      'ja': './data/resume-portfolio-ja.json',
      'en': './data/resume-portfolio-en.json'
    };
    if (!(language in paths)) throw new Error(`Unsupported language: ${language}`);
    return paths[language];
  }

  static _validatePortfolioData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format: data must be an object');
    }

    if (!Array.isArray(data.portfolios)) {
      throw new Error('Invalid data format: portfolios must be an array');
    }

    // 驗證每個 portfolio 結構
    for (let i = 0; i < data.portfolios.length; i++) {
      const portfolio = data.portfolios[i];
      const requiredFields = ['workExpId', 'url', 'projects'];
      for (const field of requiredFields) {
        if (!(field in portfolio)) {
          throw new Error(`Invalid data format: portfolio[${i}] missing ${field}`);
        }
      }
      
      if (!Array.isArray(portfolio.projects)) {
        throw new Error(`Invalid data format: portfolio[${i}].projects must be an array`);
      }
    }
  }

  // 取得所有作品集
  static getPortfolios(data) {
    return Array.isArray(data.portfolios) ? data.portfolios : [];
  }

  // 根據工作經驗 ID 取得作品集
  static getPortfolioByWorkExpId(data, workExpId) {
    if (!Array.isArray(data.portfolios)) return null;
    return data.portfolios.find(p => p.workExpId === workExpId) || null;
  }

  // 取得所有工作經驗的 ID 列表
  static getWorkExperienceIds(data) {
    if (!Array.isArray(data.portfolios)) return [];
    return data.portfolios.map(p => p.workExpId);
  }

  // 取得中繼資訊
  static getMetadata(data) {
    return {
      version: data.version || '1.0',
      lastUpdated: data.lastUpdated || null,
      totalPortfolios: Array.isArray(data.portfolios) ? data.portfolios.length : 0
    };
  }
}
