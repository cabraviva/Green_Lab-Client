const path = require('path')
const fs = require('fs')

const walk = async function * walk (dir) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name)
    yield entry
  }
}

module.exports = { walk }
