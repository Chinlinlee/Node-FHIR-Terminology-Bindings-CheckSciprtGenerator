const _ = require('lodash');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const resources = require('./resources.json');
const { getDeepKeys } = require('./myFunc')


function refreshValueSetCode () {
    for (let resource of resources) {
        let codeList = require(`./resourceAllCode/${resource}.code.json`);
        let allPath = _(codeList).groupBy("path").value();
        let allPathClean = {};
        let allPathSortedKeys = Object.keys(allPath).sort();
        let firstKey =  allPathSortedKeys[0];
        allPathClean[firstKey] = allPath[firstKey];
        Object.keys(allPath).sort().reduce(function (a, b) {
            if (b.includes(a)) {
                allPathClean[a] = allPath[a].concat(allPath[b]);
                delete allPathClean[b];
            } else {
                allPathClean[b] = _.cloneDeep(allPath[b]);
            }
            return b;
        });
        fs.writeFileSync(`./resourceAllCode/${resource}.code.refresh.json` , JSON.stringify(allPathClean , null , 4));
    }
}

module.exports = {
    refreshValueSetCode : refreshValueSetCode
}

refreshValueSetCode()