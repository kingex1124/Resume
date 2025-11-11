開發一個"履歷表"的頁面
同樣也是靜態頁面
系統要做響應式的頁面，使用包含電腦,平板，手機
需要支援多國語系，中文、日文、英文，文字語系放在
i18n\translations
相關模組放在i18n\
相關服務在services\i18nService.js

這個頁面所使用的資料會是
中文
data\resume-profile-zh-TW.json
data\resume-portfolio-zh-TW.json
日文
data\resume-profile-ja.json
data\resume-portfolio-ja.json
英文檔案我還沒弄好。

規則同work-experience.html 頁面
資料有加密就解密、沒有加密就直接讀取
以下是work-experience.html 頁面相關使用的組件，請參考
主要商業邏輯 Service
services\WorkExperienceService.js
components\WorkExperienceModal.js
components\WorkExperienceTable.js
登入相關組件
services\LoginService.js
components\LoginComponent.js
多國語系相關組件
services\i18nService.js
i18n\LanguageManager.js
導覽列相關組件
components\Navigation.js
其他組件
components\LoadingAndErrorComponent.js
存取資料的Repository
repositories\WorkExperienceRepository.js

新頁面請寫在resume.html
讀取檔案的請寫在以下
repositories\PortfolioRepository.js 讀取 data\resume-portfolio-{lang}.json
repositories\ProfileRepository.js 讀取 data\resume-profile-{lang}.json

然後商業邏輯都寫在 services\ResumeService.js 如果有組ui相關的js，也可以請寫到裡面，
UI共用元件可以放到 components裡面

接下來來說明呈現資料的方式

最上面標題是大標題 履歷表(h2)
再來是小標題(h3) info 
用類似像下面這樣，會有條線在底下
參考用底線:
{
    font-size: 1.8rem;
    color: #2c3e50;
    margin-bottom: 1.5rem;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.5rem;
    font-weight: 600;
}

然後使用 項目符號列表 從 data\resume-profile-zh-TW.json 取得的資料
profile.fullName
profile.email
info.name
info.name
...(info 有多筆，都列上去)
info會是連結，文字點了會另外開頁面跳出去，網指是info.url

再來是小標題(h3) 教育背景，一樣套用類似上面的參考用底線

內容一樣是 項目符號列表 從 data\resume-profile-zh-TW.json 取得的資料
項目符號列表顯示 請幫我分左邊與右邊，右邊的部分內容貼右側，然後文字都置左切齊。

第一層 education.school                                             {education.location}
第二層 {education.degrees.degree} {education.degrees.major}         {education.endDate}
第二層 {education.degrees.degree} {education.degrees.major}
第一層 education.school                                             {education.location}
第二層 {education.degrees.degree} {education.degrees.major}         {education.endDate}
...(education.school 與 education.degrees都有多筆，都列上去，父層是education.school，子層是education.degrees)

再來是小標題(h3) 工作經歷，一樣套用類似上面的參考用底線
資料從 data\resume-portfolio-zh-TW.json 取得(資料一)，同時也要取得 data\work-experience-zh-TW.json資料(資料二)，用來map用的
(由於 data\work-experience-zh-TW.json 已經被我加密了，你會看不到資料結構，所以我放了一個 data\work-experience-zh-TW(參考資料結構用).json 給你參考資料結構)
幫我切分左邊與右邊，右邊的部分內容貼右側，然後文字都置左切齊。
{workExperiences.company.name}          {workExperiences.company.location}
{workExperiences.summary}               {workExperiences.period.start}-{workExperiences.period.end}({workExperiences.period.duration}) 

補充說明:
1.這邊的工作經歷資料通通都以資料一為基準
2.第一筆資料 請抓取資料一的 portfolios.workExpId map 到 資料二的 workExperiences.id 然後就使用 workExperiences.company.name 來顯示
3.workExperiences.company.name 需要幫我換成可以點擊後轉頁的網址(非另開視窗) 網址為資料表一的 portfolios.url
4.workExperiences.period.duration 有資料才需要加 括號()

在往下幫我用一條分隔線 來區隔專案內容
然後就是用 項目符號列表的方式呈現
第一層 {workExperiences.projects.name}
第二層 {portfolios.projects.items.text}
第二層 {portfolios.projects.items.text}
第二層 {portfolios.projects.items.text}
...有多筆資料 取依照portfolios.projects.items.sort排序

補充說明:
1.這邊的工作經歷資料通通都以資料一為基準
2.第一層資料 請抓取資料一的 portfolios.projects.projectId map 到 資料二的 workExperiences.projects.id 然後就使用 workExperiences.projects.name 來顯示
3.workExperiences.projects.name 需要幫我換成可以點擊後轉頁的網址(非另開視窗) 網址為資料表一的 portfolios.projects.url

資料一的專案會有多個，請依序顯示。

在往下就是第二筆 資料一當中的工作經歷，然後就循環到最後。

最後 是小標題(h3) 專業技能，一樣套用類似上面的參考用底線
內容是 項目符號列表 從 data\resume-profile-zh-TW.json 取得的資料
第一層 {skills.category}: {skills.items}、{skills.items}、{skills.items}、{skills.items}
第一層 {skills.category}: {skills.items}、{skills.items}、{skills.items}、{skills.items}
第一層 {skills.category}: {skills.items}、{skills.items}、{skills.items}、{skills.items}
...skills.category為多筆資料 請依照 skills.sort 排序往下列，
同時 skills.items 也是多筆資料 請用 、 列上去。

程式碼請以好維護的方式來編寫，不需要寫任何測試的程式。
css 檔案也需要幫我拆分模組，不要都使用 style.css
共用就另外拆模組出來。
屬於這個頁面專屬的，就建立專屬於這個頁面的css檔案。