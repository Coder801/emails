const fs = require('fs');
const path = require('path');
const emailFolder = path.resolve(__dirname, '../pages/emails');
const files = fs.readdirSync(emailFolder);

module.exports = function(options) {
  return files.map(fileName => {
    let templateName = fileName.split('.')[0];
    return `<button class="small expanded" href="emails/${fileName}">${templateName.toUpperCase()}</button><spacer size="20">`
  }).join('');
}
