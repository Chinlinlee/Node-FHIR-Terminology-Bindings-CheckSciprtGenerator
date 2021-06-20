const { valueSetCrawl } = require('./getValueSetCrawler.js');
const { getValueSetCodeList } = require('./getValueSetCodeList');
const { refreshValueSetCode } = require('./refreshValueSet');
const { getDefinition } = require('./getDefinition');
const { generateCheckScript } = require('./genCheck');
const mkdirp = require('mkdirp');
const refresh = false;

(async ()=> {
    mkdirp.sync("./resourceAllCode");
    mkdirp.sync("./resourceAllCode");
    mkdirp.sync("./resourceAllCode");
    mkdirp.sync("./resourceAllCode");
    mkdirp.sync("./resourceAllCode");
    if (refresh) {
        valueSetCrawl();
        await getValueSetCodeList();
        refreshValueSetCode();
        await getDefinition();
    }
    generateCheckScript();
})();