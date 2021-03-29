/* global waitfor, zGET, $$, fetch, io, socket, __german */
const isGerman = __german
window.isGerman = isGerman
const mergeImages = require('merge-images')
window.socket = null

const { getAccount, setAccount } = require('./lib/mcapi')

/* global Notification */
class RawPushNotification {
  constructor (appName, title, body, icon, onClick, autoFocus = true) {
    this.appName = appName
    this.title = title
    this.body = body
    this.icon = icon
    this.onClick = onClick
  }

  send () {
    const notification = new Notification(this.title, {
      body: this.body,
      icon: this.icon
    })

    notification.addEventListener('click', this.onClick)
    notification.addEventListener('click', () => {
      win.getCurrentWindow().focus()
    })
    return notification
  }
}

class PushNotification extends RawPushNotification {
  constructor (title, { body = '', onClick = function () {} }) {
    super('Green_Lab Client', title, body, require('path').join(__dirname, 'icon.png'), onClick)
  }
}

const sortCosmeticTexturesByPriority = (rawTextures) => {
  const textures = rawTextures.sort((last, current) => {
    if (last.priority > current.priority) return 1
    if (last.priority < current.priority) return -1
    return 0
  })
  return textures
}

const onlyImageURLOfCosmeticTextures = (arrayOfCompiledTextures) => {
  const final = []
  for (const texture of arrayOfCompiledTextures) {
    final.push(texture.img)
  }
  return final
}

const mergeCosmeticTexturesToSkin = async (textures) => {
  const compiledTextures = onlyImageURLOfCosmeticTextures(sortCosmeticTexturesByPriority(textures))
  return await mergeImages(compiledTextures, { width: 64, height: 64 })
}
window.mergeCosmeticTexturesToSkin = mergeCosmeticTexturesToSkin

window._log = console.log
console.log = (...logs) => {
  logs.forEach((item) => {
    try {
      if (item.includes('THREE.WebGLRenderer: Context Lost.')) reloadLauncher()
    } catch {}
  })
  window._log(...logs)
}

const random = require('./lib/random.js')
const getOptifineDownloadURL = require('./lib/optifine-url.js')
const dlFile = require('./lib/dlfile.js')
const os = require('os-utils')
const { Client, Authenticator } = require('minecraft-launcher-core')
const path = require('path')
const win = require('./lib/win.js')
const opn = require('opn')
const { v4: uuidv4 } = require('uuid')

const { openFile } = require('./lib/fs-plus')

const { changeSkin } = require('./lib/mcapi')
window.changeSkin = changeSkin
window.opn = opn

win.maximizeWindow()

var runningVanilla = false

function auth () {
  const acc = getAccount()
  return Authenticator.getAuth(acc.email, acc.pw)
}

const { /* isWin, */ getAppData } = require('./lib/glc-path')
const { getVersion } = require('./lib/info')
const { jsonFetch, getLatestMCJSON, getLatest } = require('./lib/http')
window.getVersion = getVersion

async function getLatestMCDownload () {
  return (await jsonFetch((await getLatest()).url)).downloads.client.url
}
window.getLatestMCDownload = getLatestMCDownload
window.getLatest = getLatest
async function getLatestVersion () {
  const launchermeta = await (await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json')).json()
  return launchermeta.latest.release
  // return JSON.parse(fs.readFileSync(path.join(getAppData(), path.join('.minecraft', 'versions/version_manifest_v2.json')))).latest
}

async function launchVanilla (dir = '', version = { number: null, type: 'release' }) {
  if (version.number === null) version.number = await getLatestVersion()
  const launcher = new Client()

  const opts = {
    clientPackage: null,
    authorization: auth(),
    root: path.join(getAppData(), path.join('.minecraft', dir)),
    version,
    memory: {
      min: `${mcRam().min}G`,
      max: `${mcRam().max}G`
    }
  }

  launcher.launch(opts)
  win.minimizeWindow()
  launcher.on('debug', (e) => console.log('[DEBUG] ' + e))
  launcher.on('data', (e) => {
    if (window.playingSinglePlayer === '!no') {
      if (e.includes('Saving chunks for level') && !e.includes('all chunks') && !e.includes('All chunks')) window.playingSinglePlayer = false
    } else {
      if (e.includes('Saving chunks for level') && !e.includes('all chunks') && !e.includes('All chunks')) {
        const currentLevel = e.replace(/(.*?)'ServerLevel\[(.*?)\]'\/(.*?)/, '$2').replace(/minecraft:overworld/g, '').replace(/minecraft:the_end/g, '').replace(/minecraft:the_nether/g, '')
        console.log('Saved Chunks:', currentLevel)
        window.playingSinglePlayer = true
        dc.setActivity({
          details: 'Single Player',
          state: `${currentLevel}`,
          startTimestamp: dc.getActivity().startTimestamp
        })
      }
    }

    if (e.includes('Stopping server') && window.playingSinglePlayer === true) {
      window.playingSinglePlayer = '!no'
      dc.setActivity({
        details: 'In Game',
        state: 'Main Menu',
        startTimestamp: dc.getActivity().startTimestamp
      })
    }

    if (e.includes('[Render thread/INFO]: Stopping!') && (!e.includes('<'))) {
      // Stopping
      runningVanilla = false
      $$('centeredplaybtn').any('innerText', isGerman() ? 'Spielen' : 'Play')
      win.getCurrentWindow().focus()
    }
    console.log('[DATA] ' + e)
  })

  return launcher
}
window.launchVanilla = launchVanilla

async function launchOptiFine (dir = '') {
  const launcher = new Client()

  const opts = {
    clientPackage: null,
    authorization: auth(),
    root: path.join(getAppData(), path.join('.minecraft', dir)),
    version: { type: 'release', number: (fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/latest.optifine.mc.num`).toString('utf-8')), custom: 'of' },
    memory: {
      min: `${mcRam().min}G`,
      max: `${mcRam().max}G`
    }
  }

  launcher.launch(opts)
  win.minimizeWindow()
  launcher.on('debug', (e) => console.log('[DEBUG] ' + e))
  launcher.on('data', (e) => {
    if ((e.includes('[Render thread/INFO]: Stopping!') || e.includes('[main/INFO]: Stopping!')) && (!e.includes('<'))) {
      // Stopping
      runningVanilla = false
      $$('centeredplaybtn').any('innerText', isGerman() ? 'Spielen' : 'Play')
    }

    if (window.playingSinglePlayer === '!no') {
      if (e.includes('Saving chunks for level') && !e.includes('all chunks') && !e.includes('All chunks')) window.playingSinglePlayer = false
    } else {
      if (e.includes('Saving chunks for level') && !e.includes('all chunks') && !e.includes('All chunks')) {
        const currentLevel = e.replace(/(.*?)'ServerLevel\[(.*?)\]'\/(.*?)/, '$2').replace(/minecraft:overworld/g, '').replace(/minecraft:the_end/g, '').replace(/minecraft:the_nether/g, '')
        console.log('Saved Chunks:', currentLevel)
        window.playingSinglePlayer = true
        dc.setActivity({
          details: 'Single Player',
          state: `${currentLevel}`,
          startTimestamp: dc.getActivity().startTimestamp
        })
      }
    }

    if (e.includes('Stopping server') && window.playingSinglePlayer === true) {
      window.playingSinglePlayer = '!no'
      dc.setActivity({
        details: 'In Game',
        state: 'Main Menu',
        startTimestamp: dc.getActivity().startTimestamp
      })
    }

    console.log('[DATA] ' + e)
  })
  // const launcher = launchVanilla(undefined, { type: 'release', number: (fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/latest.optifine.mc.num`).toString('utf-8')), custom: 'of' })
  return launcher
}
window.launchOptiFine = launchOptiFine

function mcRam () {
  return {
    min: (Math.round(Math.round(os.totalmem()) / 1024) / 2) - (Math.round(Math.round(os.totalmem()) / 3 / 1024)),
    max: (Math.round(Math.round(os.totalmem()) / 1024) / 2)
  }
}

const { getAccessTokenForMC } = require('./lib/mcapi')
window.getAccessTokenForMC = getAccessTokenForMC

var currentPage = 'game'

function loadPage (id) {
  currentPage = id
  pages[id]().then(content => {
    $$('main').innerHTML = content
  })
}

const pages = {
  game: require('./lib/pages/game'),
  worlds: require('./lib/pages/worlds'),
  skins: require('./lib/pages/skins'),
  online: require('./lib/pages/glc-online'),
  about: require('./lib/pages/about')
}

/* global waitFor */

function searchForSkin (q) {
  console.log('[SKINS] Searching for ' + q)
  $$('skinbox.bs ul').innerHTML = `<h1>${isGerman() ? 'Suche nach' : 'Searching for'} ${q} Skins</h1>`
  waitFor(zGET({ url: `http://minecraft.novaskin.me/search?q=model:Player+${encodeURIComponent(q)}&json=true` }), (skinlist) => {
    skinlist = JSON.parse(skinlist)
    const skins = skinlist.skins
    $$('skinbox.bs ul').innerHTML = ''
    skins.forEach((skin, indexOfSkin) => {
      $$('skinbox.bs ul').innerHTML += `
        <li>
          <skin skinurl="${skin.url}">
            <h4>${skin.title}</h4>
            <img style="cursor:pointer;" onclick="addSkin('${skin.title}','${skin.url}')" src="${skin.screenshot}" alt="${skin.title}" />
          </skin>
        </li>
      `
    })
  })
}

window.searchForSkin = searchForSkin

function changeSkinName (skinIndexID, newName) {
  const skinDex = JSON.parse(fs.readFileSync(`${directory}/skins/index.json`).toString('utf-8'))
  skinDex[skinIndexID].name = newName
  fs.writeFileSync(`${directory}/skins/index.json`, JSON.stringify(skinDex))
}

function delSkin (skinIndexID) {
  let skinDex = JSON.parse(fs.readFileSync(`${directory}/skins/index.json`).toString('utf-8'))
  skinDex = skinDex.filter((_foo, i) => { return i !== skinIndexID })
  fs.writeFileSync(`${directory}/skins/index.json`, JSON.stringify(skinDex))
}

window.changeSkinName = changeSkinName
window.delSkin = delSkin

function editSkin (name, file) {
  name = decodeURIComponent(name)
  file = decodeURIComponent(file)
  console.log(`[SKINS] Editing ${name}`)
  const popup = document.createElement('div')
  popup.classList.add('popup')
  let indexOfTheSkin = 0

  const skinFilter = (elem, i) => {
    if (elem.name === name && elem.file === file) indexOfTheSkin = i
    return elem.name === name && elem.file === file
  }

  const skinDex = JSON.parse(fs.readFileSync(`${directory}/skins/index.json`).toString('utf-8'))
  skinDex.filter(skinFilter)

  popup.innerHTML = `
    <i onclick="this.parentElement.outerHTML='';reloadLauncher()" class="fas fa-chevron-left choose_this" style="position:fixed;top:6vh;left:1vw;"></i>
    <h1 style="text-align:center"><input type="text" value="${name}" oninput="changeSkinName(${indexOfTheSkin},this.value)" /></h1>
    <i onclick="delSkin(${indexOfTheSkin});reloadLauncher()" class="fas fa-trash choose_this" style="position:fixed;top:6vh;right:1vw;color:#a80d0d;"></i>
  `

  $$('body').append(popup)
}
window.editSkin = editSkin

/* global $ */
function reloadLauncher () {
  try {
    if (fs.readFileSync(`${getAppData()}/Green_Lab-Client.refreshed.file`).toString('utf-8') === 'true') return
  } catch {
    fs.writeFileSync(`${getAppData()}/Green_Lab-Client.refreshed.file`, 'false')
    return reloadLauncher()
  }

  fs.writeFileSync(`${getAppData()}/Green_Lab-Client.refreshed.file`, 'true')
  $.page.refresh()
}

window.addEventListener('keydown', (e) => {
  if (((e.ctrlKey && e.key === 'r') || e.key === 'F5') && runningVanilla) {
    e.preventDefault()
  }
})

const prompt = require('electron-prompt')
async function chooseLocalSkin () {
  addLocalSkin((await prompt({ title: isGerman() ? 'Skin hinzufügen' : 'Add Skin', label: isGerman() ? 'Gib einen Namen für den neuen Skin ein:' : 'Enter a name for the skin:', value: 'Skin', type: 'input' })), await openFile())
}
window.chooseLocalSkin = chooseLocalSkin

function addLocalSkin (name, file) {
  console.log(`[SKINS] Adding Skin ${name} from ${file}`)
  const __file = `${uuidv4()}.png`
  fs.copyFileSync(file, `${getAppData()}/.Green_Lab-Client-MC/skins/${__file}`)
  const skinDex = JSON.parse(fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/skins/index.json`))
  skinDex.push({
    name,
    file: __file
  })
  fs.writeFileSync(`${getAppData()}/.Green_Lab-Client-MC/skins/index.json`, JSON.stringify(skinDex))
  console.log(`[SKINS] Added Skin ${name} to My Skins`)
  loadPage('skins')
}

function addSkin (name, url) {
  console.log(`[SKINS] Adding Skin ${name} from ${url}`)
  const __file = `${uuidv4()}.png`
  dlFile(url, `${getAppData()}/.Green_Lab-Client-MC/skins/${__file}`, () => {
    const skinDex = JSON.parse(fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/skins/index.json`))
    skinDex.push({
      name,
      file: __file
    })
    fs.writeFileSync(`${getAppData()}/.Green_Lab-Client-MC/skins/index.json`, JSON.stringify(skinDex))
    console.log(`[SKINS] Added Skin ${name} to My Skins`)
    loadPage('skins')
  }, () => {})
}

window.addSkin = addSkin

loadPage(currentPage)

const pictures = require('./lib/pictures.js')

window.isVanillaUpToDate = false
window.isOptiFineUpToDate = false

// Random MC Picture:
$$('body').style.background = `url('${random.choose(pictures)}.png') no-repeat center center fixed`
$$('body').style.backgroundSize = 'cover'

const fs = require('fs')

const directory = path.join(getAppData(), '.Green_Lab-Client-MC')
if (!fs.existsSync(directory)) fs.mkdirSync(directory)

function enableEnglishOnly () {
  fs.writeFileSync(path.join(directory, 'english-only.enabled'), 'true')
  reloadLauncher()
}

function disableEnglishOnly () {
  fs.writeFileSync(path.join(directory, 'english-only.enabled'), 'false')
  reloadLauncher()
}

window.enableEnglishOnly = enableEnglishOnly
window.disableEnglishOnly = disableEnglishOnly

// Start GLC-Online
if (!fs.existsSync(path.join(directory, 'glc-online'))) fs.mkdirSync(path.join(directory, 'glc-online'))
if (!fs.existsSync(path.join(directory, 'glc-online', '.enabled'))) fs.writeFileSync(path.join(directory, 'glc-online', '.enabled'), 'true')
if (!fs.existsSync(path.join(directory, 'glc-online', 'friends.json'))) fs.writeFileSync(path.join(directory, 'glc-online', 'friends.json'), '[]')
if (!fs.existsSync(path.join(directory, 'glc-online', 'blocked.json'))) fs.writeFileSync(path.join(directory, 'glc-online', 'blocked.json'), '[]')
if (!fs.existsSync(path.join(directory, 'glc-online', 'fr.enabled'))) fs.writeFileSync(path.join(directory, 'glc-online', 'fr.enabled'), 'true')
if (!fs.existsSync(path.join(directory, 'english-only.enabled'))) disableEnglishOnly()

function disableGLC () {
  fs.writeFileSync((path.join(directory, 'glc-online', '.enabled')), 'false')
}

function enableGLC () {
  fs.writeFileSync((path.join(directory, 'glc-online', '.enabled')), 'true')
}

function disableFR () {
  fs.writeFileSync((path.join(directory, 'glc-online', 'fr.enabled')), 'false')
}

function enableFR () {
  fs.writeFileSync((path.join(directory, 'glc-online', 'fr.enabled')), 'true')
}

function isMyFriend (ign) {
  let isFriend = false

  JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'friends.json')).toString('utf-8')).forEach(__friend => {
    if (__friend === ign) isFriend = true
  })

  JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'blocked.json')).toString('utf-8')).forEach(blockedFriend => {
    if (blockedFriend === ign) isFriend = false
  })

  return isFriend
}

function requestFriend (ign) {
  if (socket) {
    console.log(`Sent friend request to ${ign}`)
    socket.emit('claimFriendRequest', ign)
  }
}

function addFriend (ign) {
  const friends = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'friends.json')).toString('utf-8'))
  friends.push(ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'friends.json'), JSON.stringify(friends))
  skinViewHandler()
}

function removeFriend (ign) {
  let friends = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'friends.json')).toString('utf-8'))
  friends = friends.filter(friend => friend !== ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'friends.json'), JSON.stringify(friends))
  skinViewHandler()
}

function blockFriend (ign) {
  removeFriend(ign)
  const blocked = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'blocked.json')).toString('utf-8'))
  blocked.push(ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'blocked.json'), JSON.stringify(blocked))
  skinViewHandler()
}

function unblockFriend (ign) {
  let blocked = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'blocked.json')).toString('utf-8'))
  blocked = blocked.filter(_blocked => _blocked !== ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'blocked.json'), JSON.stringify(blocked))
  skinViewHandler()
}

function sendAcceptFriendNotification (ign) {
  if (socket) socket.emit('addedFriend', ign)
}

function sendChatMessage (to, msg) {
  if (!socket) return
  if (!msg) return
  if (msg.trim() === '') return

  socket.emit('sendChatMessage', { to, msg })
}

window.addFriend = addFriend
window.blockFriend = blockFriend
window.unblockFriend = unblockFriend
window.enableGLC = enableGLC
window.disableGLC = disableGLC
window.enableFR = enableFR
window.disableFR = disableFR
window.isMyFriend = isMyFriend
window.requestFriend = requestFriend
window.sendAcceptFriendNotification = sendAcceptFriendNotification
window.sendChatMessage = sendChatMessage

// End GLC-Online

const { spawn } = require('child_process')

if (!fs.existsSync(`${directory}/latest.vanilla`)) fs.writeFileSync(`${directory}/latest.vanilla`, 'NOT_INSTALLED')

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
        if (isGerman()) {
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

const { atob } = require('./lib/b64')

const { getSkin } = require('./lib/mcapi')

async function getIGN () {
  return ((await getAccessTokenForMC()).selectedProfile.name)
}

async function __ignHandler () {
  try {
    const __acc = getAccount()
    if (await getIGN() !== __acc.name) {
      setAccount(await getIGN(), __acc.email, __acc.pw)
      reloadLauncher()
    }
  } catch (err) {
    console.error(err)
  }
}

win.getCurrentWindow().webContents.on('new-window', function (e, url, foo, bar, _window) {
  require('electron').shell.openExternal(url)
})

setInterval(__ignHandler, 120 * 1000)
__ignHandler()

window.getSkin = getSkin

window.setAccount = setAccount

var sets = {
  skin: function (callbackfunc) {
    callbackfunc('NOT_SUPPORTED')
  },
  name: function (cb) {
    if (!getAccount()) {
      document.querySelector('html').innerHTML = `
        <head>
          <title>Login – Green_Lab Client</title>

          <link rel="stylesheet" href="login.css" />
          <script>
          function setAccount (name, email, pw) {
            if (!name) return null
            if (!email) return null
            if (!pw) return null
            pw = btoa(pw)
            require('fs').writeFileSync(directory + '/account.json', JSON.stringify({ name, pw, email }))
          }
          </script>

        </head>

        <body style="background:url('mansion.png');background-size:cover;">
            <div><h1>Login</h1></div>
            <div><input type="text" placeholder="InGame-Name" /></div>
            <div><input type="email" placeholder="E-Mail" /></div>
            <div><input type="password" placeholder="Passwor${isGerman() ? 't' : 'd'}" /></div>

            <div><button onclick="setAccount(document.querySelectorAll('div input')[0].value, document.querySelectorAll('div input')[1].value, document.querySelectorAll('div input')[2].value);location.reload()">Login</button></div>
        </body>
      `
      return null
    } else {
      getAccessTokenForMC().then(async ({ accessToken }) => {
        fs.writeFileSync(`${getAppData()}/Green_Lab-Client.refreshed.file`, 'false')

        if (fs.readFileSync(path.join(directory, 'glc-online', '.enabled')).toString('utf-8') === 'true') {
          window.socket = io('https://GreenLabClientParty.greencoder001.repl.co', {
            secure: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            timeout: 500 * 1000,
            autoConnect: true,
            auth: ({ accessToken, mail: getAccount().email, ign: getAccount().name })
          })

          socket.on('onlineState', console.log)

          socket.on('log', (logmsg) => {
            console.log('[GLC-ONLINE] ' + logmsg)
          })

          socket.on('youAreTheFriendOf', newFriend => {
            addFriend(newFriend)

            const notification = new PushNotification(isGerman() ? 'Akzeptierte Freundschaftsanfrage' : 'Accepted Friend Request', {
              body: isGerman() ? `${newFriend} ist jetzt dein Freund!` : `${newFriend} is now your friend!`
            })

            notification.send()
          })

          socket.on('chatMessage', ({ message, from }) => {
            if (!isMyFriend(from)) return

            const notification = new PushNotification(isGerman() ? `Neue Nachricht von ${from}` : `New message by ${from}`, {
              body: message
            })

            notification.send()
          })

          socket.on('receiveFriendRequest', (friendRequest) => {
            let isBlockedFriend = false
            if (fs.readFileSync(path.join(directory, 'glc-online', 'fr.enabled')).toString('utf-8') !== 'true') isBlockedFriend = true
            JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'blocked.json')).toString('utf-8')).forEach(blockedFriend => {
              if (blockedFriend === friendRequest.from) isBlockedFriend = true
            })

            JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'friends.json')).toString('utf-8')).forEach(blockedFriend => {
              if (blockedFriend === friendRequest.from) isBlockedFriend = true
            })

            if (isBlockedFriend) return
            console.log(`Received friend request from ${friendRequest.from}`)
            const notification = new PushNotification(isGerman() ? 'Neue Freundschaftsanfrage' : 'New Friend Request', {
              body: `${friendRequest.from} ${isGerman() ? 'möchte dein Freund sein' : 'wants to be your friend'}!`,
              onClick: async () => {
                function _createSkinViewFor (canvas) {
                  canvas.classList.remove('skin_view_chooser')
                  const skinViewer = new skinview3d.SkinViewer({
                    canvas,
                    width: 300,
                    height: 400,
                    skin: `${canvas.getAttribute('skinfile')}`
                  })

                  const control = skinview3d.createOrbitControls(skinViewer)
                  control.enableRotate = true
                  control.enableZoom = false
                  control.enablePan = false

                  const runAnimation = skinViewer.animations.add(skinview3d.RunningAnimation)
                  runAnimation.speed = 0.75
                }

                // Friend Request Popup
                const popup = document.createElement('div')
                popup.classList.add('popup')
                popup.classList.add('friendRequestPopup')

                const uuid = JSON.parse(await (await fetch(`https://api.mojang.com/users/profiles/minecraft/${friendRequest.from}`)).text()).id
                let skinfile = (await jsonFetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`))
                skinfile = JSON.parse(atob(skinfile.properties[0].value)).textures.SKIN.url

                const friendSkinView = document.createElement('canvas')
                friendSkinView.setAttribute('skinfile', skinfile)

                popup.innerHTML = `
                  <i onclick="this.parentElement.outerHTML=''" class="fas fa-chevron-left choose_this" style="position:fixed;top:6vh;left:1vw;"></i>
                  <h1>${friendRequest.from}</h1>
                  <skinContainer></skinContainer>

                  <buttoncontainer>
                    <button class="accept" onclick="addFriend('${friendRequest.from}');sendAcceptFriendNotification('${friendRequest.from}');this.parentElement.parentElement.outerHTML=''"><i class="fas fa-check"></i> ${isGerman() ? 'Annehmen' : 'Accept'}</button>
                    <button class="ignore" onclick="this.parentElement.parentElement.outerHTML=''"><i class="fas fa-arrow-up"></i> ${isGerman() ? 'Ignorieren' : 'Ignore'}</button>
                    <button class="block" onclick="blockFriend('${friendRequest.from}');this.parentElement.parentElement.outerHTML=''"><i class="fas fa-ban"></i> ${isGerman() ? 'Blockieren' : 'Block'}</button>
                  </buttoncontainer>
                `

                popup.querySelector('skinContainer').append(friendSkinView)

                _createSkinViewFor(friendSkinView)

                $$('body').append(popup)
              }
            })
            notification.send()
          })
        }
      }).catch(() => { if ((fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`).toString('utf-8') !== 'NOT_LOGGED_IN')) return; fs.writeFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`, 'NOT_LOGGED_IN'); reloadLauncher() })
    }

    // return getAccount().name
    waitfor(zGET({ url: `https://api.mojang.com/users/profiles/minecraft/${getAccount().name}` }), (v) => {
      cb(JSON.parse(v).name)
    })
  }
}

function logout () { if ((fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`).toString('utf-8') !== 'NOT_LOGGED_IN')) return; fs.writeFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`, 'NOT_LOGGED_IN'); reloadLauncher() }
window.logout = logout

function createSkinViewFor (canvas) {
  canvas.classList.remove('skin_view_chooser')
  const skinViewer = new skinview3d.SkinViewer({
    canvas,
    width: 300,
    height: 400,
    skin: `${getAppData()}/.Green_Lab-Client-MC/skins/${canvas.parentElement.getAttribute('skinfile')}`
  })

  const control = skinview3d.createOrbitControls(skinViewer)
  control.enableRotate = true
  control.enableZoom = false
  control.enablePan = false

  const runAnimation = skinViewer.animations.add(skinview3d.RunningAnimation)
  runAnimation.speed = 0.75
}

function viewMYSKINS () {
  try {
    $$('.skin_view_chooser')
  } catch { return false }

  if (!$.exist($$('.skin_view_chooser')[0])) {
    // Only one Skin
    createSkinViewFor($$('.skin_view_chooser'))
  } else {
    // Multiple Skins
    $$('.skin_view_chooser').forEach(elem => {
      createSkinViewFor(elem)
    })
  }
}

const a = () => {
  viewMYSKINS()
  for (const b of document.querySelectorAll('[set]')) {
    const attr = b.getAttribute('set').split('@')[0]
    const into = b.getAttribute('set').split('@')[1]
    b.removeAttribute('set')
    sets[attr]((a) => {
      b[into] = a
    })
  }

  window.requestAnimationFrame(a)
}

window.requestAnimationFrame(a)

const { friendView, partyView } = require('./lib/pages/glc-online-views')

// Skin View
/* global skinview3d */
window.lastSkinURL = null
window.skin = null
async function skinViewHandler () {
  try {
    $$('.parties').innerHTML = await partyView()
    $$('.friends').innerHTML = await friendView()
  } catch {}

  getSkin(skinURL => {
    if (skinURL === window.lastSkinURL) return
    window.lastSkinURL = skinURL
    window.skin = new skinview3d.SkinViewer({
      canvas: $$('#skinView'),
      width: Math.floor(window.innerWidth / 7),
      height: Math.floor(window.innerHeight / 5),
      skin: skinURL
    })

    const control = skinview3d.createOrbitControls(window.skin)
    control.enableRotate = false
    control.enableZoom = false
    control.enablePan = false

    const walkAnimation = window.skin.animations.add(skinview3d.WalkingAnimation)
    walkAnimation.speed = 1
  })
}

window.socketPlaying = null

function setSkinViewerSize () {
  if (window.socketPlaying !== runningVanilla) {
    if (socket) {
      window.socketPlaying = runningVanilla
      socket.emit('setPlayingState', window.socketPlaying)
      console.log('Set InGame to: ' + window.socketPlaying)
    }

    if (window.socketPlaying) {
      dc.setActivity({
        details: 'In Game',
        state: 'Main Menu',
        startTimestamp: dc.getActivity().startTimestamp
      })
    } else {
      dc.setActivity({
        details: 'Idle',
        startTimestamp: dc.getActivity().startTimestamp
      })
    }
  }

  if (!window.skin) return
  window.skin.width = Math.floor(window.innerWidth / 7)
  window.skin.height = Math.floor(window.innerHeight / 5)

  if (getAccount() === false) {
    if ((fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`).toString('utf-8') === 'NOT_LOGGED_IN')) {
      fs.writeFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`, 'NOT_LOGGED_IN')
      reloadLauncher()
    }
  }
}

setInterval(skinViewHandler, 30 * 1000)
setInterval(setSkinViewerSize, 200)
setTimeout(() => {
  setInterval(() => {
    if (socket && socket.disconnected) reloadLauncher()
  }, 1000)
}, 20000)
skinViewHandler()

const up2IH = () => {
  if (window.isOptiFineUpToDate && window.isVanillaUpToDate) {
    clearInterval(window.up2DateInterval)
    $$('.up2DateWaitingScreen').outerHTML = ''
  } else {
    try {
      $$('.up2DateWaitingScreen')
    } catch {
      $$('body').innerHTML += `
        <div class="popup up2DateWaitingScreen"><h1 style="text-align:center;">${isGerman() ? 'Minecraft wird installiert' : 'Installing Minecraft'}</h1></div>
      `
    }
  }
}
window.up2DateInterval = setInterval(up2IH, 500)
up2IH()

;(async () => {
  process.versions.minecraft = await getLatestVersion()
})()

const dc = require('./lib/discord')
dc.setActivity({
  details: 'Idle',
  largeImageKey: 'icon',
  startTimestamp: dc.getActivity().startTimestamp
})
