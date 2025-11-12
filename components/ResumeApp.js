/**
 * Resume Application Component
 * 履歷表頁面應用程式 - 只負責渲染
 */

import { ResumeService } from '../services/ResumeService.js';
import { LoadingAndErrorComponent } from './LoadingAndErrorComponent.js';
import { LanguageManager } from '../i18n/LanguageManager.js';

export default class ResumeApp {
  /**
   * 渲染頁面內容
   */
  renderPage() {
    try {
      const appState = ResumeService.getAppState();

      // 檢查資料是否已載入
      if (!appState.profileData) {
        console.warn('⚠️ 個人資訊未載入');
        return;
      }

      // 更新頁面標題和小標題的翻譯
      this._updatePageTitles();

      // 渲染個人資訊
      this._renderProfile();

      // 渲染教育背景
      this._renderEducation();

      // 渲染工作經歷
      this._renderWorkExperience();

      // 渲染專業技能
      this._renderSkills();

      console.log('✅ 頁面渲染完成');
    } catch (error) {
      console.error('❌ 頁面渲染失敗:', error);
      LoadingAndErrorComponent.showError(
        'loading-error-container',
        '頁面渲染失敗: ' + error.message
      );
    }
  }

  /**
   * 更新頁面標題翻譯
   * @private
   */
  _updatePageTitles() {
    const appState = ResumeService.getAppState();
    const translations = appState.translations;

    if (!translations) return;

    // 更新主標題
    const titleElem = document.getElementById('resume-title');
    if (titleElem && translations.resume?.title) {
      titleElem.textContent = translations.resume.title;
    }

    // 更新各區塊小標題
    const profileSubtitle = document.getElementById('profile-subtitle');
    if (profileSubtitle && translations.resume?.profileSection?.title) {
      profileSubtitle.textContent = translations.resume.profileSection.title;
    }

    const educationSubtitle = document.getElementById('education-subtitle');
    if (educationSubtitle && translations.resume?.educationSection?.title) {
      educationSubtitle.textContent = translations.resume.educationSection.title;
    }

    const workExpSubtitle = document.getElementById('work-experience-subtitle');
    if (workExpSubtitle && translations.resume?.workExperienceSection?.title) {
      workExpSubtitle.textContent = translations.resume.workExperienceSection.title;
    }

    const skillsSubtitle = document.getElementById('skills-subtitle');
    if (skillsSubtitle && translations.resume?.skillsSection?.title) {
      skillsSubtitle.textContent = translations.resume.skillsSection.title;
    }
  }

  /**
   * 渲染個人資訊
   * @private
   */
  _renderProfile() {
    const profileList = document.getElementById('profile-list');
    if (!profileList) return;

    const profile = ResumeService.getProfile();
    const infoLinks = ResumeService.getInfoLinks();

    if (!profile) {
      profileList.innerHTML = '<li>無個人資訊</li>';
      return;
    }

    let html = '';

    // 只顯示姓名
    if (profile.fullName) {
      html += `<li>${this._escapeHtml(profile.fullName)}</li>`;
    }

    // 只顯示電郵
    if (profile.email) {
      html += `<li>${this._escapeHtml(profile.email)}</li>`;
    }

    // 資訊連結
    if (infoLinks && infoLinks.length > 0) {
      for (const info of infoLinks) {
        html += `<li><a href="${this._escapeHtml(info.url)}" target="_blank">${this._escapeHtml(info.name)}</a></li>`;
      }
    }

    profileList.innerHTML = html;
  }

  /**
   * 渲染教育背景
   * @private
   */
  _renderEducation() {
    const educationList = document.getElementById('education-list');
    if (!educationList) return;

    const education = ResumeService.getEducation();

    if (!education || education.length === 0) {
      educationList.innerHTML = '<li>無教育背景資訊</li>';
      return;
    }

    let html = '';

    for (const edu of education) {
      // 學校層級 (第一層 - 實心圓圈)
      html += `<li class="education-item school-level">`;
      html += `<div class="school-info">`;
      html += `<span class="school-name">${this._escapeHtml(edu.school)}</span>`;
      html += `<span class="school-location">${this._escapeHtml(edu.location)}</span>`;
      html += `</div>`;

      // 學位層級 (第二層 - 空心圓圈)
      if (edu.degrees && edu.degrees.length > 0) {
        html += `<ul class="education-degrees">`;
        for (let i = 0; i < edu.degrees.length; i++) {
          const degree = edu.degrees[i];
          html += `<li class="education-item degree-level">`;
          html += `<span class="degree-info">`;
          html += this._escapeHtml(degree.degree);
          if (degree.major) {
            html += ` ${this._escapeHtml(degree.major)}`;
          }
          html += `</span>`;
          
          // 只在第一個學位顯示日期
          if (i === 0 && edu.endDate) {
            html += `<span class="end-date">${this._escapeHtml(edu.endDate)}</span>`;
          }
          html += `</li>`;
        }
        html += `</ul>`;
      }

      html += `</li>`;
    }

    educationList.innerHTML = html;
  }

  /**
   * 渲染工作經歷
   * @private
   */
  _renderWorkExperience() {
    const workExpList = document.getElementById('work-experience-list');
    if (!workExpList) return;

    const portfolios = ResumeService.getPortfolios();
    const workExperiences = ResumeService.getSortedWorkExperiences();

    if (!portfolios || portfolios.length === 0) {
      workExpList.innerHTML = '<li>無工作經歷資訊</li>';
      return;
    }

    let html = '';

    // 對於每個 portfolio
    for (const portfolio of portfolios) {
      // 從 workExperiences 找到對應的資料
      const workExpData = ResumeService.getWorkExperienceWithPortfolio(portfolio.workExpId);

      if (!workExpData || !workExpData.workExp) continue;

      const workExp = workExpData.workExp;

      // 第一層：公司資訊 (無項目符號，用 div)
      html += `<div class="work-experience-item work-level">`;
      html += `<div class="company-info">`;
      // 使用 LanguageManager 正確處理相對路徑，支援 GitHub Pages 的 /Resume/ 前綴
      const companyUrl = LanguageManager.generateLanguageURL(this._escapeHtml(portfolio.url));
      html += `<a href="${companyUrl}" class="company-name">${this._escapeHtml(workExp.company.name)}</a>`;
      html += `<span class="company-location">${this._escapeHtml(workExp.company.location)}</span>`;
      html += `</div>`;

      // 工作簡介與期間
      html += `<div class="period-summary">`;
      html += `<span class="summary">${this._escapeHtml(workExp.summary)}</span>`;
      let periodText = `${this._escapeHtml(workExp.period.start)}-${this._escapeHtml(workExp.period.end)}`;
      if (workExp.period.duration) {
        periodText += `(${this._escapeHtml(workExp.period.duration)})`;
      }
      html += `<span class="period">${periodText}</span>`;
      html += `</div>`;

      // 分隔線
      html += `<div class="work-experience-divider"></div>`;

      // 專案內容（按 sort 排序） - 使用 <ul> 嵌套，專案為第一層項目符號
      if (portfolio.projects && portfolio.projects.length > 0) {
        html += `<ul class="work-experience-projects">`;
        
        // 按 sort 欄位排序專案
        const sortedProjects = [...portfolio.projects].sort((a, b) => (a.sort || 0) - (b.sort || 0));
        
        for (const portfolioProject of sortedProjects) {
          // 尋找對應的 workExp 專案名稱
          const workExpProject = workExp.projects.find(p => p.id === portfolioProject.projectId);
          if (!workExpProject) continue;

          // 第二層：專案名稱 (第一層項目符號)
          html += `<li class="work-experience-item project-level">`;
          // 使用 LanguageManager 正確處理相對路徑，支援 GitHub Pages 的 /Resume/ 前綴
          const projectUrl = LanguageManager.generateLanguageURL(this._escapeHtml(portfolioProject.url));
          html += `<a href="${projectUrl}" class="project-name">${this._escapeHtml(workExpProject.name)}</a>`;

          // 第三層：專案項目內容（嵌套的 ul，第二層項目符號）
          if (portfolioProject.items && portfolioProject.items.length > 0) {
            html += `<ul class="work-experience-details">`;
            const sortedItems = [...portfolioProject.items].sort((a, b) => (a.sort || 0) - (b.sort || 0));
            for (const item of sortedItems) {
              html += `<li class="work-experience-item project-detail">`;
              html += this._escapeHtml(item.text);
              html += `</li>`;
            }
            html += `</ul>`;
          }

          html += `</li>`;
        }
        
        html += `</ul>`;
      }

      html += `</div>`;
    }

    workExpList.innerHTML = html;
  }

  /**
   * 渲染專業技能
   * @private
   */
  _renderSkills() {
    const skillsList = document.getElementById('skills-list');
    if (!skillsList) return;

    const skills = ResumeService.getSkills();

    if (!skills || skills.length === 0) {
      skillsList.innerHTML = '<li>無專業技能資訊</li>';
      return;
    }

    let html = '';

    for (const skill of skills) {
      html += `<li class="skills-item">`;
      html += `<span class="skill-category">${this._escapeHtml(skill.category)}</span>`;
      html += `: `;

      if (skill.items && skill.items.length > 0) {
        const itemsText = skill.items.map(item => this._escapeHtml(item)).join('、');
        html += `<span class="skill-items">${itemsText}</span>`;
      }

      html += `</li>`;
    }

    skillsList.innerHTML = html;
  }

  /**
   * 轉義 HTML 特殊字元
   * @param {string} text - 文字
   * @returns {string} 轉義後的文字
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
