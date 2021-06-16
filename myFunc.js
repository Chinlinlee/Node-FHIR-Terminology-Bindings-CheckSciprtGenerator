function getDeepKeys(obj) {
    let keys = [];
    for(let key in obj) {
        keys.push(key);
        if(typeof obj[key] === "object") {
            let subkeys = getDeepKeys(obj[key]);
            keys = keys.concat(subkeys.map(function(subkey) {
                return key + "." + subkey;
            }));
        }
    }
    return keys;
}

module.exports = {
    getDeepKeys : getDeepKeys
}