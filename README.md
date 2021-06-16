# Node-FHIR-Terminology-Bindings-CheckSciprtGenerator

## 關於
FHIR各個Resource下都有Terminology Bindings綁定Resource指定欄位中的code(編碼)
每個resource每個指定欄位都要寫一次程式，非常麻煩。
此專案主要產生給(Simple-Express-FHIR-Server)[https://github.com/Chinlinlee/Simple-Express-FHIR-Server]實作EU-DGC(疫苗護照)用的檢查function

## 各檔案說明
- getValueSetCrawler (抓取eu的Terminology Bindings ValueSet)
- getValueSetCodeList (爬蟲各valueSet並整理code下來)
- refreshValuset (再度整理code)
- getDefinition (獲取官方resource的定義 (snapshot table爬蟲))
- genCheck (產生檢查的程式碼)
- resources.json (要找的resource清單)