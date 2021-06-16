const { valueSetCrawl } = require('./getValueSetCrawler.js');
const { getValueSetCodeList } = require('./getValueSetCodeList');
const { refreshValueSetCode } = require('./refreshValueSet');
const { getDefinition } = require('./getDefinition');
const { generateCheckScript } = require('./genCheck');
const mkdirp = require('mkdirp');


(()=> {
    mkdirp.sync("./resourceAllCode");
    mkdirp.sync("./resourceAllCode");
    mkdirp.sync("./resourceAllCode");
    mkdirp.sync("./resourceAllCode");
    mkdirp.sync("./resourceAllCode");
    valueSetCrawl();
    getValueSetCodeList();
    refreshValueSetCode();
    getDefinition();
    generateCheckScript();
})