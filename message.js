const errorCode = {
    1: "Your password was incorrect!",
    2: "Please wait a few minutes before trying to login!",
    3: "Failed to convert user-readable number into computer-readable number!",
    4: "Please login first!",
    5: "Failed to goto identifier!",
    6: "The search field couldn't be found! It seems like you aren't authenticated!",
    7: "The input field for your credentials couldn't be found!",
    8: "The page isn't available!",
    9: "Can't comment on post!",
    10: "Account couldn't be found!",
    11: "Account is private. You need to follow the account first, to request data!",
    12: "Browser is not running!",
    13: "Failed to load session!",
    14: "The bot is already authenticated!"
};
const errorTemplate = (code) => {
    return {
        code,
        message: errorCode[code]
    };
};
const errorMessage = {
    "incorrectPassword": errorTemplate(1),
    "waitBeforeLogin": errorTemplate(2),
    "failedToConvertNumber": errorTemplate(3),
    "notAuthenticated": errorTemplate(4),
    "failedToGotoIdentifier": errorTemplate(5),
    "searchFieldNotFound": errorTemplate(6),
    "inputFieldNotFound": errorTemplate(7),
    "pageNotAvailable": errorTemplate(8),
    "cantCommentPost": errorTemplate(9),
    "accountNotFound": errorTemplate(10),
    "accountPrivate": errorTemplate(11),
    "browserNotRunning": errorTemplate(12),
    "failedToLoadSession": errorTemplate(13),
    "botAlreadyAuthenticated": errorTemplate(14)
};

module.exports = { errorMessage };