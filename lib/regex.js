/**
 * URL RegExp
 * @type {RegExp}
 */
exports.urlRgx =
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/gi;
// Matches "en-us" or "en-us/"
exports.localeRgx = /\/[a-z][a-z]-[a-z][a-z](|\/)/;
/**
 * RegExp test for only numbers. From https://stackoverflow.com/questions/1779013/check-if-string-contains-only-digits
 * @type {RegExp}
 */
exports.numbersOnlyRgx = /^\d+$/;

/**
 * MongoDB Object ID RegExp
 * @type {RegExp}
 */
exports.mongoIdRgx = /^[a-f\d]{24}$/i;
