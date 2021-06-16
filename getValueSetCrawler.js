const _ = require('lodash');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const resources = require('./resources.json');

async function getValueSet (resourceName) {
    let html = await fetch(`https://build.fhir.org/ig/hl7-eu/dgc/StructureDefinition-${resourceName}-dgc.html`);
    let htmlText = await html.text();
    let $ = cheerio.load(htmlText);
    $(".list").each((i , e)=> {
        if ($(e).prev().text().toLowerCase().includes("bindings")) {
            let valueSetList = [];
            let obj = {};
            $(e).find("td").each((ti , te)=>{
                if (ti > 2) {
                    if (ti % 3 == 0) {
                        obj.path = $(te).text().replace(`${resourceName}.` , "").replace(/:(.*)/gi , "");
                    } else if (ti % 3 == 1)  {
                        obj.conformance = $(te).text();
                    } else {
                        obj.valueSet = $(te).find("a").attr("href");
                        if (!/^http/gi.test(obj.valueSet)) {
                            obj.valueSet = `https://build.fhir.org/ig/hl7-eu/dgc/${obj.valueSet}`;
                        }
                        obj.valueSet = obj.valueSet.replace(".html" , ".json");
                        valueSetList.push(obj);
                        obj = {};
                    }
                }
            });
            fs.writeFileSync(`./resourceValueSet/${resourceName}.valueSet.json` , JSON.stringify(valueSetList , null , 4));
        }
    })
}

function valueSetCrawl() {
    for (let resoruce of resources) {
        getValueSet(resoruce)
    }
}


module.exports = {
    valueSetCrawl : valueSetCrawl
}