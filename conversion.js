const { IBConversionError } = require("./error");
const { errorMessage } = require("./message");
const { User, SearchResult } = require("./types");

/**
 * 
 * @param {String | User | SearchResult} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @returns {User}
 */
const identifierToUser = (userIdentifier) => {
    if(userIdentifier instanceof User) return userIdentifier;
    if(userIdentifier instanceof SearchResult) {
        if(userIdentifier.isHashtag) throw new IBConversionError(errorMessage.failedToConvertCauseSearchResultLinksToHashtag.code, errorMessage.failedToConvertCauseSearchResultLinksToHashtag.message, userIdentifier, User);

        return new User(userIdentifier.link, userIdentifier.title, userIdentifier.description);
    }
    if(typeof userIdentifier === "string") {
        if(userIdentifier.startsWith("https://www.instagram.com")) return new User(userIdentifier, userIdentifier.split("/")[3]);
        return new User(`https://www.instagram.com/${userIdentifier}/`, userIdentifier);
    }

    throw new IBConversionError(errorMessage.failedToConvertCauseIdentifierDoesntMatchPattern.code, errorMessage.failedToConvertCauseIdentifierDoesntMatchPattern.message, userIdentifier, User);
};

module.exports = {
    identifierToUser
};