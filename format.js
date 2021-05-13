/**
 * 
 * @param {String} str 
 * @returns {Number}
 */
const StringToNumber = (str) => {
    const strWithoutPoints = str.split(",").join("").split(".").join("");
    return parseInt(strWithoutPoints);
};

module.exports = { StringToNumber };