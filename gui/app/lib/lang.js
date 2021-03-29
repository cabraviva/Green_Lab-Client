/* global $ */

function __isWin () {
  return require('os').platform().toLowerCase().includes('win32')
}

function __getAppData () {
  if (!__isWin()) return require('os').userInfo().homedir
  return require('path').join(require('os').userInfo().homedir, require('path').join('AppData', 'Roaming'))
}

function __german () {
  if (require('fs').readFileSync(require('path').join(__getAppData(), '.Green_Lab-Client-MC', 'english-only.enabled')).toString('utf-8') === 'true') {
    return false
  }
  return $.lang.toLowerCase().includes('de')
}
module.exports = __german
