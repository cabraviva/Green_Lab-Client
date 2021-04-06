const fs = require('fs')
const { jsonFetch, getLatestMCJSON, getLatest } = require('./http')
const { spawn } = require('child_process')
const { /* isWin, */ getAppData } = require('./glc-path')
const getOptifineDownloadURL = require('./optifine-url.js')
const path = require('path')
const directory = path.join(getAppData(), '.Green_Lab-Client-MC')
const dlFile = require('./dlfile.js')

async function getLatestMCDownload () {
  return (await jsonFetch((await getLatest()).url)).downloads.client.url
}

async function installVanilla () {
  const mcdl = await getLatestMCDownload()
  let _isNewest = false
  try {
    _isNewest = fs.readFileSync(`${directory}/latest.vanilla`).toString('utf-8') === mcdl
  } catch {
    _isNewest = false
  }

  if (_isNewest) { window.isVanillaUpToDate = true; return console.log('[VANILLA] Already installed') }

  console.log('Downloading Vanilla')
  dlFile(mcdl, `${directory}/green_lab-client.jar`, () => {
    getLatest().then(({ id }) => {
      fs.writeFileSync(`${directory}/latest.vanilla.num`, id)
    })
    fs.writeFileSync(`${directory}/green_lab-client.json`, getLatestMCJSON())
    console.log('[VANILLA] Successfully installed')
    fs.writeFileSync(`${directory}/latest.vanilla`, mcdl)
    window.isVanillaUpToDate = true
    return true
  }, console.log)
}

if (!fs.existsSync(`${directory}/latest.vanilla`)) fs.writeFileSync(`${directory}/latest.vanilla`, 'NOT_INSTALLED')

installVanilla().then(_ => {
  if (!fs.existsSync(`${directory}/lastVersion.optifine`)) fs.writeFileSync(`${directory}/lastVersion.optifine`, 'NOT_INSTALLED')
  if (!fs.existsSync(path.join(directory, 'skins'))) fs.mkdirSync(path.join(directory, 'skins'))
  if (!fs.existsSync(path.join(directory, 'skins/index.json'))) fs.writeFileSync(path.join(directory, 'skins/index.json'), '[]')
  getOptifineDownloadURL().then(optiFineURL => {
    if (fs.readFileSync(`${directory}/lastVersion.optifine`).toString('utf-8') !== optiFineURL.split('&')[0]) {
      console.log('Installing OptiFine')
      dlFile(optiFineURL, `${directory}/optifine.jar`, () => {
        console.log('Successfully installed OptiFine')
        fs.writeFileSync(`${directory}/lastVersion.optifine`, optiFineURL.split('&')[0])
        // Run OptiFine Installer
        if (window.isGerman()) {
          window.alert('Eine neue Version von OptiFine ist verfügbar und kann installiert werden. Bitte drücke den Install Button in dem Fenster, welches sich gleich öffnet')
        } else {
          window.alert('A new version of OptiFine is available and can be installed. Please press the Install Button in the new Window')
        }
        const java = 'java'
        console.log(`[JAVA] Using Java command: ${java}`)
        const OptiFineInstaller = spawn(java, ['-jar', `${directory}/optifine.jar`])
        OptiFineInstaller.stdout.on('data', (data) => {
          console.log(`[OPTIFINE] ${data}`)
        })

        OptiFineInstaller.stderr.on('data', (data) => {
          console.error(`[OPTIFINE ERROR] ${data}`)
        })

        OptiFineInstaller.on('close', (code) => {
          const b = optiFineURL.replace('https://optifine.net/downloadx?f=', '').replace('.jar', '').split('_')
          const optiDir = `${b[1]}-${b[0]}_${b[2]}_${b[3]}_${b[4]}`.split('&')[0]
          console.log(`[OPTIFINE] Installation finished: ${code}`)
          console.log(optiDir)
          fs.writeFileSync(`${directory}/latest.optifine.mc.num`, b[1])
          // Launch Optifine: launchVanilla(undefined, { type: 'release', number: '${v}', custom: 'of' })

          if (fs.existsSync(`${getAppData()}/.minecraft/versions/of`)) fs.rmdirSync(`${getAppData()}/.minecraft/versions/of`, { recursive: true })

          fs.renameSync(`${getAppData()}/.minecraft/versions/${optiDir}`, `${getAppData()}/.minecraft/versions/of`, console.error)
          fs.renameSync(`${getAppData()}/.minecraft/versions/of/${optiDir}.jar`, `${getAppData()}/.minecraft/versions/of/of.jar`)
          fs.renameSync(`${getAppData()}/.minecraft/versions/of/${optiDir}.json`, `${getAppData()}/.minecraft/versions/of/of.json`)
          window.isOptiFineUpToDate = true
        })
      }, console.log)
    } else {
      window.isOptiFineUpToDate = true
      console.log('OptiFine is already installed')
    }
  })
})
