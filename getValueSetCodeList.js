const _ = require('lodash');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const resources = require('./resources.json');


async function getValueSetCodeList () {
    for (let resource of resources) {
        let valueSetList = require(`./resourceValueSet/${resource}.valueSet.json`);
        let codeList = [];
        for (let key in valueSetList) {
            let valueSet = valueSetList[key];
            let url = valueSet["valueSet"];
            let path = valueSet["path"];
            let valueSetJsonFetch = await fetch(url);
            if(valueSetJsonFetch.status != 200) continue;
            let valueSetJson = JSON.parse(await valueSetJsonFetch.text());
            let system = "";
            for(let key in valueSetJson.compose.include) {
                let systemInInclude = _.get(valueSetJson.compose.include[key] , "system")
                if (systemInInclude) {
                    system = systemInInclude;
                }
                let concept = _(valueSetJson.compose.include[key].concept).map().value().map(v=> Object.assign({} , {
                    path: path ,
                    system : system , 
                    code : v.code  , 
                    display : v.display || ""
                }));
                codeList.push(...concept);
            }
        }
        if (codeList.length > 0) {
            fs.writeFileSync(`./resourceAllCode/${resource}.code.json` , JSON.stringify(codeList , null , 4));
        }
    }
}

module.exports = {
    getValueSetCodeList : getValueSetCodeList
}
