/* global main, log, getLatestServerDownload */

const path = require('path')
const getAppData = window.__getAppData
const fs = require('fs')
const directory = path.join(getAppData(), '.Green_Lab-Client-MC', 'servers')
const dlFile = require('../dlfile.js')

if (!fs.existsSync(directory)) fs.mkdirSync(directory)
if (!fs.existsSync(path.join(directory, 'index.json'))) fs.writeFileSync(path.join(directory, 'index.json'), JSON.stringify([]))
if (!fs.existsSync(path.join(directory, 'l.json'))) fs.writeFileSync(path.join(directory, 'l.json'), JSON.stringify('NI'))

const isj = async (f) => {
  const dl = await getLatestServerDownload()
  const ldl = JSON.parse(fs.readFileSync(path.join(directory, 'l.json')))

  if (dl !== ldl) {
    window.alert('We need to download the latest server.jar. Please click ok and wait')

    dlFile(dl, path.join(directory, 'server.jar'), () => {
      fs.writeFileSync(path.join(directory, 'l.json'), JSON.stringify(dl))
      log('Downloaded Server jar')
      f()
    }, v => console.log(`Downloading Server Jar ${v}`))
  } else {
    f()
  }
}

const aisj = () => {
  return new Promise(resolve => {
    isj(resolve)
  })
}

// NGROK
window.ngrok = {
  connect: (port) => {
    return new Promise(resolve => {
      main.emit('spawnNgrok', port, resolve)
    })
  },
  kill: () => {
    main.emit('killNgrok')
  }
}
// #####

// SERVER PAGE
window.loadServerPage = sid => {
  const server = JSON.parse(fs.readFileSync(path.join(directory, 'index.json'))).filter(_id => _id.id === sid)[0]

  console.log(`Showing Server Dashboard for ${server.name} (${server.id})`)
}
// ##########

module.exports = async () => {
  log('Server Page was called')

  log('SERVER_JAR_DL')

  await aisj()

  let serverlist = ''
  const index = JSON.parse(fs.readFileSync(path.join(directory, 'index.json')))

  for (const server of index) {
    serverlist += `
      <div class="world" data-is-server data-server-id="${server.id}">
        <h2 class="choose_this" onclick="window.loadServerPage(\`${server.id}\`)">${server.name}</h2>
      </div>
    `
  }

  return `
    <div class="content">
      ${serverlist}
    </div>
  `
}
