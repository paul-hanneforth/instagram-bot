const errorCode = {
    "1": "Wrong password!"
}
const errorTemplate = (code) => {
    return {
        "error": {
            code,
            message: errorCode[code]
        }
    }
}
const errorMessage = {
    "wrongPassword": errorTemplate(1)
}

module.exports = { errorMessage }