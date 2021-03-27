const _os = require('os')
const path = require('path')

function isWin () {
  return _os.platform().toLowerCase().includes('win32')
}

function getAppData () {
  if (!isWin()) return _os.userInfo().homedir
  return path.join(_os.userInfo().homedir, path.join('AppData', 'Roaming'))
}

module.exports = {
  isWin,
  getAppData
}
