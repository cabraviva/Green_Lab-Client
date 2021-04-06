/* global $$, fetch, socket, __german */
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
window.PushNotification = PushNotification

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
const dlFile = require('./lib/dlfile.js')

const path = require('path')
const win = require('./lib/win.js')
const opn = require('opn')
const { v4: uuidv4 } = require('uuid')

const { openFile } = require('./lib/fs-plus')

const { changeSkin } = require('./lib/mcapi')
window.changeSkin = changeSkin
window.opn = opn

win.maximizeWindow()

window.runningVanilla = false

const { /* isWin, */ getAppData } = require('./lib/glc-path')
const { getVersion } = require('./lib/info')
const { jsonFetch, getLatest } = require('./lib/http')
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

// Launch
const { launchVanilla, launchOptiFine } = require('./lib/launch')
window.launchVanilla = launchVanilla
window.launchOptiFine = launchOptiFine

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
  about: require('./lib/pages/about'),
  vr: require('./lib/pages/vr')
}

// Skins
const { editSkin, delSkin, changeSkinName, searchForSkin } = require('./lib/__skin')
window.editSkin = editSkin
window.delSkin = delSkin
window.changeSkinName = changeSkinName
window.searchForSkin = searchForSkin

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
  if (((e.ctrlKey && e.key === 'r') || e.key === 'F5') && window.runningVanilla) {
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
const { addFriend, blockFriend, unblockFriend, enableGLC, disableGLC, enableFR, disableFR, isMyFriend, requestFriend, sendAcceptFriendNotification, sendChatMessage } = require('./lib/glc-online-funcs')
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

require('./lib/install')

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

const sets = require('./lib/sets')

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
window.skinViewHandler = skinViewHandler

window.socketPlaying = null

function setSkinViewerSize () {
  if (window.socketPlaying !== window.runningVanilla) {
    if (socket) {
      window.socketPlaying = window.runningVanilla
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
