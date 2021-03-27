const path = require('path')
const fs = require('fs')
const { getAppData } = require('./glc-path')

module.exports = {
  getVersion: () => fs.readFileSync(path.join(getAppData(), '_green_lab-client-mc', '.latest')).toString('utf-8')
}
