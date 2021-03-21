/* global waitfor, zGET, $$, fetch, io, socket */
const mergeImages = require('merge-images')
window.socket = null

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

const listCosmetics = async () => {
  const cosmetics = await jsonFetch('https://greenlabclient.greencoder001.repl.co/skin-editor/cosmetics/list/')
  return cosmetics
}

async function getCosmeticByID (id) {
  return await jsonFetch(`https://greenlabclient.greencoder001.repl.co/skin-editor/cosmetics/view/${id}`)
}

window.listCosmetics = listCosmetics
window.getCosmeticByID = getCosmeticByID

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
      if (item.includes('THREE.WebGLRenderer: Context Lost.')) window.lastSkinURL = null
    } catch {}
  })
  window._log(...logs)
}

async function getLatest () {
  const launchermeta = await (await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json')).json()
  return launchermeta.versions.filter((version) => { return version.id === launchermeta.latest.release })[0]
}
window.getLatest = getLatest

const mojang = require('mojang')
const random = require('./random.js')
const getOptifineDownloadURL = require('./optifine-url.js')
const dlFile = require('./dlfile.js')
const axios = require('axios')
const os = require('os-utils')
const _os = require('os')
const path = require('path')
const win = require('./win.js')
const opn = require('opn')
const nbt = require('nbt')
const { v4: uuidv4 } = require('uuid')

const openFile = async function openFile () {
  return (await (require('electron').remote.dialog).showOpenDialog()).filePaths[0]
}

function changeSkin (skinID) {
  console.log('[SKINS] Changing to skin ' + skinID)
  getUUID(getAccount().name, uuid => {
    getAccessTokenForMC().then(({ accessToken }) => {
      const stream = fs.createReadStream(`${getAppData()}/.Green_Lab-Client-MC/skins/${skinID}`)
      mojang.uploadSkin({ accessToken }, uuid, stream, false).then(() => {
        console.log('[SKINS] Changed to skin ' + skinID)
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
      }).catch((err) => {
        window.alert('Skin Error: The Skin ' + skinID + ' is not valid. Please chosse an other Skin')
        console.error(err)
      })
    }).catch(() => {
      fs.writeFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`, 'NOT_LOGGED_IN')
      reloadLauncher()
    })
  })
}
window.changeSkin = changeSkin

window.opn = opn
window.nbt = nbt

win.maximizeWindow()
const { Client, Authenticator } = require('minecraft-launcher-core')

var runningVanilla = false
window.rmc = runningVanilla

function auth () {
  const acc = getAccount()
  return Authenticator.getAuth(acc.email, acc.pw)
}

function isWin () {
  return _os.platform().toLowerCase().includes('win32')
}

function getAppData () {
  if (!isWin()) return _os.userInfo().homedir
  return path.join(_os.userInfo().homedir, path.join('AppData', 'Roaming'))
}

async function jsonFetch (url) {
  return await (await fetch(url)).json()
}

async function getLatestMCJSON () {
  return (JSON.stringify((await jsonFetch((await getLatest()).url))))
}
window.getLatestMCJSON = getLatestMCJSON

async function getLatestMCDownload () {
  return (await jsonFetch((await getLatest()).url)).downloads.client.url
}
window.getLatestMCDownload = getLatestMCDownload

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
    if (e.includes('[Render thread/INFO]: Stopping!') && (!e.includes('<'))) {
      // Stopping
      runningVanilla = false
      $$('centeredplaybtn').any('innerText', 'Play')
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
      $$('centeredplaybtn').any('innerText', 'Play')
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

async function getAccessTokenForMC () {
  const account = getAccount()
  return (await axios.post('https://authserver.mojang.com/authenticate', {
    agent: {
      name: 'Minecraft',
      version: 1
    },
    username: account.email,
    password: account.pw
  }, { 'Content-Type': 'application/json' })).data
}
window.getAccessTokenForMC = getAccessTokenForMC

var currentPage = 'game'

function loadPage (id) {
  currentPage = id
  pages[id]().then(content => {
    $$('main').innerHTML = content
  })
}

const pages = {
  game: async () => {
    return `
      <ul class="top-nav">
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').show()" class="active">OptiFine</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').show();$$('.optifine').hide()">Vanilla</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').hide()">Fabric</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').hide()">Forge</li>
      </ul>
      <div class="content optifine" style="overflow:hidden;padding:0;margin:0">
        <div class="flexer">
          <centeredplaybtn onclick="if(runningVanilla==false){$$('centeredplaybtn').any('innerText', 'Runnning');runningVanilla=true;launchOptiFine()}">Play</centeredplaybtn>
        </div>
      </div>
      <div class="content vanilla" style="overflow:hidden;padding:0;margin:0;display:none;">
        <div class="flexer">
          <centeredplaybtn onclick="if(runningVanilla==false){$$('centeredplaybtn').any('innerText', 'Runnning');runningVanilla=true;launchVanilla()}">Play</centeredplaybtn>
        </div>
      </div>
    `
  },
  worlds: () => {
    return new Promise((resolve, reject) => {
      let final = ''
      let worlds = []
      allWorlds(w => {
        worlds.push(w)
      }).then(() => {
        worlds = worlds.filter((elem) => { return !elem.endsWith('.zip') })
        let i = 0
        for (const world of worlds) {
          try {
            let leveldat = null
            nbt.parse(fs.readFileSync(path.join(world, 'level.dat')), (err, data) => {
              if (err) return reject(window.alert('An error occurs! INVALID_LEVELDAT_NBT. Please report this issue on https://github.com/greencoder001/Green_Lab-Client/issues/new. FURTHER INFORMATION: ' + world + '\nYou can also try to delete the folder with the world.'))
              leveldat = data

              final += `
                <div class="world">
                  <h2>${leveldat.value.Data.value.LevelName.value}</h2>
                  <span class="version">${(leveldat?.value?.Data?.value?.Version?.value?.Name?.value) || 'Unknown Version'}</span>
                </div>
              `
              i += 1

              if (i >= worlds.length) {
                resolve(`
                  <div class="content">
                    ${final}
                  </div>
                `)
              }
            })
          } catch (err) {
            console.warn('Error: Reading World ' + world + ' failed')
            // window.alert('An error occurs! INVALID_WORLD. Please report this issue on https://github.com/greencoder001/Green_Lab-Client/issues/new. FURTHER INFORMATION: ' + world + ' [See Console] \nYou can also try to delete the folder with the world.')
            i += 1
            if (i >= worlds.length) {
              resolve(`
                <div class="content">
                  ${final}
                </div>
              `)
            }
          }
        }
      })
    })
  },
  skins: async () => {
    let allSkins = ''
    const skinIndex = JSON.parse(fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/skins/index.json`))
    skinIndex.forEach((skin, index) => {
      if (skin === null) return
      allSkins += `
        <skin skinfile="${skin.file}">
          <h4 style="text-align:center;"><span onclick="changeSkin('${skin.file}')" class="choose_this">${skin.name}</span> <i class="fas fa-pen choose_this" onclick="editSkin('${encodeURIComponent(skin.name)}','${encodeURIComponent(skin.file)}')" title="Edit ${skin.name}"></i></h4>
          <canvas class="skin_view_chooser"></canvas>
        </skin>
      `
    })

    const cosmeticList = await listCosmetics()

    const skineditornaventries = {
      hair: '',
      skins: '',
      eyes: '',
      faces: '',
      clothes: '',
      arms: '',
      legs: '',
      accessoires: ''
    }

    for (const _cosmetic of cosmeticList.hairs) {
      const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
      skineditornaventries.hair += `
        <cosmeticentry cosmeticid="${_cosmetic.id}">
          <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
          <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
        </cosmeticentry>
      `
    }

    for (const _cosmetic of cosmeticList.skins) {
      const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
      skineditornaventries.skins += `
        <cosmeticentry cosmeticid="${_cosmetic.id}">
          <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
          <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
        </cosmeticentry>
      `
    }

    for (const _cosmetic of cosmeticList.eyes) {
      const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
      skineditornaventries.eyes += `
        <cosmeticentry cosmeticid="${_cosmetic.id}">
          <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
          <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
        </cosmeticentry>
      `
    }

    for (const _cosmetic of cosmeticList.faces) {
      const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
      skineditornaventries.faces += `
        <cosmeticentry cosmeticid="${_cosmetic.id}">
          <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
          <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
        </cosmeticentry>
      `
    }

    for (const _cosmetic of cosmeticList.clothes) {
      const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
      skineditornaventries.clothes += `
        <cosmeticentry cosmeticid="${_cosmetic.id}">
          <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
          <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
        </cosmeticentry>
      `
    }

    for (const _cosmetic of cosmeticList.arms) {
      const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
      skineditornaventries.arms += `
        <cosmeticentry cosmeticid="${_cosmetic.id}">
          <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
          <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
        </cosmeticentry>
      `
    }

    for (const _cosmetic of cosmeticList.legs) {
      const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
      skineditornaventries.legs += `
        <cosmeticentry cosmeticid="${_cosmetic.id}">
          <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
          <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
        </cosmeticentry>
      `
    }

    for (const _cosmetic of cosmeticList.accessoires) {
      const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
      skineditornaventries.accessoires += `
        <cosmeticentry cosmeticid="${_cosmetic.id}">
          <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
          <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
        </cosmeticentry>
      `
    }

    const skineditornav = `
      <skincategory>
        <h3>Hair</h3>
        <skincategoryentries>
          <!--<cosmeticentry>
            <img src="" alt="" />
          </cosmeticentry>-->
          ${skineditornaventries.hair}
        </skincategoryentries>
      </skincategory>
    `

    return `
      <ul class="top-nav">
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').hide();$$('.myskins').show();$$('.skin-editor-container').hide()"" class="active">My Skins</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').show();$$('.myskins').hide();$$('.skin-editor-container').hide()">Browse Skins</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').hide();$$('.myskins').hide();$$('.skin-editor-container').show()">Skin Editor</li>
        <li onclick="chooseLocalSkin()">Add Skin</li>
      </ul>
      <div class="content">
        <div class="skin-editor-container" style="display:none;overflow:hidden;">
          <skineditornav>
            ${skineditornav}
          </skineditornav>
          <skineditorpreview>

          </skineditorpreview>
        </div>
        <div class="browseonly" style="display:none;">
          <skinsearch>
            <input type="text" class="searchForSkin"/>
            <button class="_b" onclick="searchForSkin($$('.searchForSkin').value)"><i class="fas fa-search"></i></button>
          </skinsearch>
          <skinbox class="bs"><ul></ul></skinbox>
        </div>
        <div class="myskins">
          <skinbox>
            <ul>
              ${allSkins}
            </ul>
          </skinbox>
        </div>
      </div>
    `
  },
  servers: async () => {
    // Servers
  },
  about: async () => {
    return `
      <div class="content">
        <h1>About Green_Lab Client</h1>
        <h3>Developed by Green_Lab</h3>

        <h2>Thanks to...</h2>
        <ul>
          <li><a onclick="event.preventDefault();opn(this.href)" href="https://github.com/bs-community/skinview3d">SkinView3D</a> and <a onclick="event.preventDefault();opn(this.href)" href="https://threejs.org">Three.js</a> for the skin viewer</li>
          <li><a onclick="event.preventDefault();opn(this.href)" href="https://www.electronjs.org">Electron</a> for the cool framework to create the app</li>
          <li><a onclick="event.preventDefault();opn(this.href)" href="https://github.com/Pierce01/MinecraftLauncher-core#readme">minecraft-launcher-core</a> for the npm module, to make it's possible to run Minecraft</li>
        </ul>
      </div>
    `
  }
}

/* global waitFor */

function searchForSkin (q) {
  console.log('[SKINS] Searching for ' + q)
  $$('skinbox.bs ul').innerHTML = `<h1>Searching for ${q} Skins</h1>`
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
  $.page.refresh()
}

window.addEventListener('keydown', (e) => {
  if (((e.ctrlKey && e.key === 'r') || e.key === 'F5') && runningVanilla) {
    e.preventDefault()
  }
})

const prompt = require('electron-prompt')
async function chooseLocalSkin () {
  addLocalSkin((await prompt({ title: 'Add Skin', label: 'Enter a name for the skin:', value: 'Skin', type: 'input' })), await openFile())
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
  reloadLauncher()
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
    reloadLauncher()
  }, () => {})
}

window.addSkin = addSkin

loadPage(currentPage)

const pictures = [
  'mansion',
  'snow',
  'underwater',
  'swamp',
  'dungeon',
  'endcity'
]

const walk = async function * walk (dir) {
  for await (const d of await fs.promises.opendir(dir)) {
    const entry = path.join(dir, d.name)
    yield entry
  }
}

async function allWorlds (cb) {
  for await (const p of walk(path.join(getAppData(), '.minecraft/saves'))) {
    cb(p)
  }
}

window.isVanillaUpToDate = false
window.isOptiFineUpToDate = false

$$('body').style.background = `url('${random.choose(pictures)}.png') no-repeat center center fixed`
$$('body').style.backgroundSize = 'cover'

const fs = require('fs')
const atob = require('atob')

const directory = path.join(getAppData(), '.Green_Lab-Client-MC')
if (!fs.existsSync(directory)) fs.mkdirSync(directory)

// Start GLC-Online
if (!fs.existsSync(path.join(directory, 'glc-online'))) fs.mkdirSync(path.join(directory, 'glc-online'))
if (!fs.existsSync(path.join(directory, 'glc-online', '.enabled'))) fs.writeFileSync(path.join(directory, 'glc-online', '.enabled'), 'true')
if (!fs.existsSync(path.join(directory, 'glc-online', 'friends.json'))) fs.writeFileSync(path.join(directory, 'glc-online', 'friends.json'), '[]')
if (!fs.existsSync(path.join(directory, 'glc-online', 'blocked.json'))) fs.writeFileSync(path.join(directory, 'glc-online', 'blocked.json'), '[]')
if (!fs.existsSync(path.join(directory, 'glc-online', 'fr.enabled'))) fs.writeFileSync(path.join(directory, 'glc-online', 'fr.enabled'), 'true')

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
    socket.emit('claimFriendRequest', ign)
  }
}

function addFriend (ign) {
  const friends = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'friends.json')).toString('utf-8'))
  friends.push(ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'friends.json'), JSON.stringify(friends))
}

function removeFriend (ign) {
  let friends = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'friends.json')).toString('utf-8'))
  friends = friends.filter(friend => friend !== ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'friends.json'), JSON.stringify(friends))
}

function blockFriend (ign) {
  removeFriend(ign)
  const blocked = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'blocked.json')).toString('utf-8'))
  blocked.push(ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'blocked.json'), JSON.stringify(blocked))
}

function sendAcceptFriendNotification (ign) {
  if (socket) socket.emit('addedFriend', ign)
}

window.addFriend = addFriend
window.blockFriend = blockFriend
window.enableGLC = enableGLC
window.disableGLC = disableGLC
window.enableFR = enableFR
window.disableFR = disableFR
window.isMyFriend = isMyFriend
window.requestFriend = requestFriend
window.sendAcceptFriendNotification = sendAcceptFriendNotification

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
        window.alert('A new version of OptiFine is available and can be installed. Please press the Install Button in the new Window')
        let java = 'java'
        if (isWin()) java = 'C:\\Program Files (x86)\\Minecraft Launcher\\runtime\\jre-x64\\bin\\java.exe'
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

function btoa (str) {
  if (Buffer.byteLength(str) !== str.length) throw new Error('bad string!')
  return Buffer.from(str, 'binary').toString('base64')
}

function getUUID (name, cb) {
  waitfor(zGET({ url: `https://api.mojang.com/users/profiles/minecraft/${getAccount().name}` }), (v) => {
    cb(JSON.parse(v).id)
  })
}

function getSkin (cb) {
  // getUUID(getAccount().name, (uuid) => {
  //   waitfor(zGET({ url: `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}` }), (v) => {
  //     cb(JSON.parse(atob(JSON.parse(v).properties.value)).textures.SKIN.url)
  //   })
  // })

  getUUID(getAccount().name, (uuid) => {
    waitfor(zGET({ url: `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}` }), (v) => {
      cb(JSON.parse(atob(JSON.parse(v).properties[0].value)).textures.SKIN.url)
    })
  })
}
window.getSkin = getSkin

function getAccount () {
  try {
    const acc = JSON.parse(fs.readFileSync(directory + '/account.json'))
    return {
      name: acc.name,
      email: acc.email,
      pw: atob(acc.pw)
    }
  } catch {
    return false
  }
}

function setAccount (name, email, pw) {
  pw = btoa(pw)
  fs.writeFileSync(directory + '/account.json', JSON.stringify({ name, pw, email }))
}
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
            <div><input type="password" placeholder="Password" /></div>

            <div><button onclick="setAccount(document.querySelectorAll('div input')[0].value, document.querySelectorAll('div input')[1].value, document.querySelectorAll('div input')[2].value);location.reload()">Login</button></div>
        </body>
      `
      return null
    } else {
      getAccessTokenForMC().then(async ({ accessToken }) => {
        if (fs.readFileSync(path.join(directory, 'glc-online', '.enabled')).toString('utf-8') === 'true') {
          window.socket = io('https://GreenLabClientParty.greencoder001.repl.co', {
            secure: true,
            auth: ({ accessToken, mail: getAccount().email, ign: getAccount().name })
          })

          socket.on('log', (logmsg) => {
            console.log('[GLC-ONLINE] ' + logmsg)
          })

          socket.on('youAreTheFriendOf', newFriend => {
            const notification = new PushNotification('Accepted Friend Request', {
              body: `${newFriend} is now your friend!`
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
            const notification = new PushNotification('New Friend Request', {
              body: `${friendRequest.from} wants to be your friend!`,
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
                    <button class="accept" onclick="addFriend('${friendRequest.from}');sendAcceptFriendNotification('${friendRequest.from}');this.parentElement.parentElement.outerHTML=''"><i class="fas fa-check"></i> Accept</button>
                    <button class="ignore" onclick="this.parentElement.parentElement.outerHTML=''"><i class="fas fa-arrow-up"></i> Ignore</button>
                    <button class="block" onclick="blockFriend('${friendRequest.from}');this.parentElement.parentElement.outerHTML=''"><i class="fas fa-ban"></i> Block</button>
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
      }).catch(() => { fs.writeFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`, 'NOT_LOGGED_IN'); reloadLauncher() })
    }

    // return getAccount().name
    waitfor(zGET({ url: `https://api.mojang.com/users/profiles/minecraft/${getAccount().name}` }), (v) => {
      cb(JSON.parse(v).name)
    })
  }
}

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

// Skin View
/* global skinview3d */
window.lastSkinURL = null
window.skin = null
function skinViewHandler () {
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

function setSkinViewerSize () {
  if (!window.skin) return
  window.skin.width = Math.floor(window.innerWidth / 7)
  window.skin.height = Math.floor(window.innerHeight / 5)
}

setInterval(skinViewHandler, 30 * 1000)
setInterval(setSkinViewerSize, 200)
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
        <div class="popup up2DateWaitingScreen"><h1 style="text-align:center;">Installing Minecraft</h1></div>
      `
    }
  }
}
window.up2DateInterval = setInterval(up2IH, 500)
up2IH()

;(async () => {
  process.versions.minecraft = await getLatestVersion()
})()
