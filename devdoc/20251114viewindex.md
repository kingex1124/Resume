更新"index.html" 的頁面
同樣也是靜態頁面
系統要做響應式的頁面，使用包含電腦,平板，手機
需要支援多國語系，中文、日文、英文，文字語系放在
i18n\translations
相關模組放在i18n\
相關服務在services\i18nService.js

這個頁面所使用的資料會是
中文
data\resume-index-zh-TW.json
日文、英文檔案我還沒弄好。

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

styles\index.css 可在調整
IndexService.js 可重構
IndexRepository.js 讀取資料用的 Repository
頁面資料為下方檔案，目前尚未加密，之後我會替換成加密檔案，請參照work-experience.html 頁面，加不加密都要可以讀取。
data\resume-index-zh-TW.json

index.html呈現方式
簡介
index.introduction
人格特質
index.personality

然後 tag幫我列在下面，tags.label 是多個資料的陣列。

這頁是首頁，可以幫我弄得美觀一點。

程式碼請以好維護的方式來編寫，不需要寫任何測試的程式。
有新的共用就另外拆模組出來。