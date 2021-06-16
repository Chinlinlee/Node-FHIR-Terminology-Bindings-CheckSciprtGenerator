const _ = require('lodash');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const resources = require('./resources.json');
const { getDeepKeys } = require('./myFunc');
const beautify = require('js-beautify').js;

let defList = [];

function generateCheckScript() {
    for (let resource of resources) {
        defList = require(`./resourceOfficialDefinition/${resource}.def.json`);
        let codeList = require(`./resourceAllCode/${resource}.code.refresh.json`);
        let checkScript = `
        const _  = require("lodash");
        const { handleError } = require("../../../models/FHIR/httpMessage")
        const codeList = require('./Immunization.code.refresh.json');\r\n
        `;
        for (let path in codeList) {
            let fieldDef = defList.filter(v=> path.includes(v.path))
            .reduce(function (a, b) {
                return a.length > b.length ? a : b;
            });
            let eachFieldDef = getFieldPathDef(fieldDef.path);
            let fieldCheckScript = getScript(eachFieldDef , path);
            checkScript+= fieldCheckScript;
        }
        let everyFieldCheckFunctionName = Object.keys(codeList).map(v=> {
            let nameCap = getNameCapitalization(v);
            return `check${nameCap}`;
        });
        checkScript+=`
            module.exports = [
                ${everyFieldCheckFunctionName.sort().join(",\r\n")}
            ]
        `
        fs.writeFileSync(`./resourceCheckCodeScript/${resource}.js` , beautify(checkScript , {
            indent_size : 4
        }));
    }
}


function getNameCapitalization (path) {
    let eachPath = path.split(".");
    let name = eachPath.map(v=> v.substr(0,1).toUpperCase() + v.substr(1)).join("");
    return name;
}

function getNameNotCapitalization (path) {
    let eachPath = path.split(".");
    let name = eachPath.map(v=> v.substr(0,1).toUpperCase() + v.substr(1)).join("");
    return name.substr(0,1).toLowerCase() + name.substr(1);
}

function getFieldPathDef (path) {
    let types = [];
    let pathSplitDot = path.split(".")
    if (pathSplitDot.length == 1) {
        types.push(...defList.filter(v => v.path == path));
    } else {
        let eachPath = []
        path.split(".").reduce(function (a , b) {
            if (!a) {
                eachPath.push(`${b}`);
                return b;
            } else {
                eachPath.push(`${a}.${b}`);
                return `${a}.${b}`;
            }
            
        } , "");
        for (let fieldPath of eachPath) {
            types.push(...defList.filter(v => v.path == fieldPath));
        }
    }
    return types;
}

function getScript (def, path) {
    let func = {
        "1" : function () {
            let scriptText = ``;
            let name = path.substr(0 , 1).toUpperCase() + path.substr(1);
            let singleFieldDef = def[0];
            if (singleFieldDef.type == "code") {
                scriptText+=`
                    function check${name}(req , res , next) {
                        let item = req.body;
                        let ${path} = _.get(item , "${path}")
                        if (${path}) {
                            let checkList = _.get(codeList , "${path}");
                            checkList = _(checkList).flatMap("code").value();
                            if (checkList.includes(${path})) {
                                next();
                            } else {
                                return res.status(400).json(handleError["code-invalid"]("invalid ${path} code " + ${path}));
                            }
                        } else {
                            next();
                        }
                    }
                `;
            } else if (singleFieldDef.type == "CodeableConcept") {
                scriptText+=`
                function check${name}(req , res , next) {
                    let item = req.body;
                    let ${path} = _.get(item , "${path}");
                    if (${path}) {
                `;
                if (singleFieldDef.isArray) {
                    scriptText+=`
                    let ${path}Codes = _(${path})
                    .flatMap("coding")
                    .map("code")
                    .compact()
                    .value();
                    `
                } else {
                    scriptText+=`
                    let ${path}Codes = _(${path}.coding)
                                                .map("code")
                                                .compact()
                                                .value();
                    `
                }
                scriptText+=`
                        let checkList = _.get(codeList , "${path}");
                        checkList = _(checkList).flatMap("code").value();
                        for (let code of ${path}Codes) {
                            if(!checkList.includes(code)) return res.status(400).json(handleError["code-invalid"](\`invalid route.coding.code \${code}\`));
                        }
                        next();
                    } else {
                        next();
                    }
                }
                `;
            } else if (singleFieldDef.type == "coding") {
                scriptText+=`
                function check${name}(req , res , next) {
                    let item = req.body;
                    let ${path} = _.get(item , "${path}");
                    if (${path}) {`;
                if (singleFieldDef.isArray) {
                    scriptText+=`
                    let ${path}Code = _(${path}.code)
                                        .value();
                    `;
                } else {
                    scriptText+=`
                    let ${path}Code = _(${path})
                                        .map("code")
                                        .compact()
                                        .value();
                    `;
                }
                scriptText+=`
                        let checkList = _.get(codeList , "${path}");
                        checkList = _(checkList).flatMap("code").value();
                        for (let code of ${path}Code) {
                            if(!checkList.includes(code)) return res.status(400).json(handleError["code-invalid"](\`invalid ${path}.code \${code}\`));
                        }
                        next();
                    } else {
                        next();
                    }
                }
                `;
            }
            return (beautify(scriptText , {
                indent_size : 4 , 
                space_after_named_function : true ,
            }))
        } , 
        "2" : function () {
            let scriptText = ``;
            let eachPath = path.split(".");
            let name = getNameCapitalization(path);
            let nameNotCap = getNameNotCapitalization(path);
            let singleFieldDef = def.pop();
            if (singleFieldDef.type == "code") {
                scriptText+=`
                    function check${name}(req , res , next) {
                        let item = req.body;
                        let ${eachPath[0]} = _.get(item , "${eachPath[0]}")
                        if (${eachPath[0]}) {
                `;
                if (def[0].isArray) {
                    scriptText+=`
                    let ${name}Codes = _(${eachPath[0]})
                                        .map("${eachPath[1]}")
                                        .compact()
                                        .value()
                    `;
                } else {
                    scriptText+=`
                    let ${nameNotCap}Codes = _(${eachPath[0]})
                                        .get("${eachPath[1]}");
                    `;
                }
                scriptText+=`     
                            let checkList = _.get(codeList , "${path}");
                            checkList = _(checkList).flatMap("code").value();
                            if (_.isArray(${nameNotCap}Codes})) {
                                for (let code of ${nameNotCap}Codes) {
                                    if(!checkList.includes(code)) return res.status(400).json(handleError["code-invalid"](\`invalid route.coding.code \${code}\`));
                                }
                                next();
                            } else {
                                if (checkList.includes(${path})) {
                                    next();
                                } else {
                                    return res.status(400).json(handleError["code-invalid"]("invalid ${path} code " + ${nameNotCap}Codes));
                                }
                            }
                        } else {
                            next();
                        }
                    }
                `;
            } else if (singleFieldDef.type == "CodeableConcept") {
                scriptText+=`
                function check${name}(req , res , next) {
                    let item = req.body;
                    let ${eachPath[0]} = _.get(item , "${eachPath[0]}");
                    if (${eachPath[0]}) {
                `;
                if ( (def[0].isArray && singleFieldDef.isArray) ||
                     (def[0].isArray && !singleFieldDef.isArray)) {
                    scriptText+=`
                    let ${nameNotCap}Codes = _(${eachPath[0]})
                    .flatMap("${eachPath[1]}")
                    .flatMap("coding")
                    .map("code")
                    .compact()
                    .value();
                    `
                } else if (!def[0].isArray && !singleFieldDef.isArray){
                    scriptText+=`
                    let ${nameNotCap}Codes = _(${eachPath[0]})
                    .pick("${eachPath[1]}")
                    .flatMap("coding")
                    .map("code")
                    .compact()
                    .value();
                    `
                }
                scriptText+=`
                        let checkList = _.get(codeList , "${path}");
                        checkList = _(checkList).flatMap("code").value();
                        for (let code of ${nameNotCap}Codes) {
                            if(!checkList.includes(code)) return res.status(400).json(handleError["code-invalid"](\`invalid route.coding.code \${code}\`));
                        }
                        next();
                    } else {
                        next();
                    }
                }
                `;
            } else if (singleFieldDef.type == "coding") {
                scriptText+=`
                function check${name}(req , res , next) {
                    let item = req.body;
                    let ${eachPath[0]} = _.get(item , "${eachPath[0]}");
                    if (${eachPath[0]}) {
                `;
                if ( (def[0].isArray && singleFieldDef.isArray) ||
                     (def[0].isArray && !singleFieldDef.isArray)) {
                    scriptText+=`
                    let ${nameNotCap}Codes = _(${eachPath[0]})
                    .flatMap("${eachPath[1]}")
                    .map("code")
                    .compact()
                    .value();
                    `
                } else if (!def[0].isArray && !singleFieldDef.isArray){
                    scriptText+=`
                    let ${nameNotCap}Codes = _(${eachPath[0]})
                    .pick("${eachPath[1]}")
                    .map("code")
                    .compact()
                    .value();
                    `
                }
                scriptText+=`
                        let checkList = _.get(codeList , "${path}");
                        checkList = _(checkList).flatMap("code").value();
                        for (let code of ${nameNotCap}Codes) {
                            if(!checkList.includes(code)) return res.status(400).json(handleError["code-invalid"](\`invalid route.coding.code \${code}\`));
                        }
                        next();
                    } else {
                        next();
                    }
                }
                `;
            }
            return (beautify(scriptText , {
                indent_size : 4 , 
                space_after_named_function : true ,
            }))
        } ,
        "3" : function () {
            return "";
        }
    }
    return func[def.length]();
}


module.exports = {
    generateCheckScript : generateCheckScript
}