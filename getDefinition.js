const _ = require('lodash');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const resources = require('./resources.json');
const { getDeepKeys } = require('./myFunc');


async function getDefinition () {
    for (let resource of resources) {
        let myDefs = [];
        //let resource = "Immunization";
        let definitionFetch = await fetch(`https://www.hl7.org/fhir/${resource}.profile.json`)
        let definitionJson = await definitionFetch.json();
        for (let element of definitionJson.snapshot.element) {
            let type = _.get(element , "type");
            if (!type) continue;
            let obj = {
                path : element.path.replace(`${resource}.` , "") ,
                type : _(element.type).map("code").value().pop() ,
                isArray : element.max == "*" ? true : false
            } 
            myDefs.push(obj);
        }
        fs.writeFileSync(`./resourceOfficialDefinition/${resource}.def.json` , JSON.stringify(myDefs , null , 4));
    }
}


module.exports = {
    getDefinition : getDefinition
}
