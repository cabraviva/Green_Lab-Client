/* global waitfor, zGET, $$ */

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

function changeSkin (skinID) {
  console.log('[SKINS] Changing to skin ' + skinID)
  getUUID(getAccount().name, uuid => {
    getAccessTokenForMC().then(({ accessToken }) => {
      const stream = fs.createReadStream(`${getAppData()}/.Green_Lab-Client-MC/skins/${skinID}`)
      mojang.uploadSkin({ accessToken }, uuid, stream, false).then(() => {
        console.log('[SKINS] Changed to skin ' + skinID)
      }).catch((err) => {
        console.error(err)
      })
    })
  })
}

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
  return _os.platform().toLowerCase().includes('win')
}

function getAppData () {
  if (!isWin()) return _os.userInfo().homedir
  return path.join(_os.userInfo().homedir, path.join('AppData', 'Roaming'))
}

function getLatestVersion () {
  return JSON.parse(fs.readFileSync(path.join(getAppData(), path.join('.minecraft', 'versions/version_manifest_v2.json')))).latest
}

function launchVanilla (dir = '', version = { number: getLatestVersion().release, type: 'release' }) {
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
  launcher.on('debug', (e) => console.log('[DEBUG] ' + e))
  launcher.on('data', (e) => {
    if (e.includes('[Render thread/INFO]: Stopping!') && (!e.includes('<'))) {
      // Stopping
      runningVanilla = false
      $$('centeredplaybtn').innerText = 'Play'
    }
    console.log('[DATA]' + e)
  })

  return launcher
}

window.launchVanilla = launchVanilla

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
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active')">OptiFine</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active')" class="active">Vanilla</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active')">Fabric</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active')">Forge</li>
      </ul>
      <div class="content flex vanilla" style="overflow:hidden;padding:0;margin:0">
        <centeredplaybtn onclick="if(runningVanilla==false){this.innerText='Running';runningVanilla=true;launchVanilla()}">Play</centeredplaybtn>
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
          let leveldat = null
          nbt.parse(fs.readFileSync(path.join(world, 'level.dat')), (err, data) => {
            if (err) return reject(window.alert('An error occurs! INVALID_LEVELDAT_NBT. Please report this issue on https://github.com/greencoder001/Green_Lab-Client/issues/new. FURTHER INFORMATION: ' + world))
            leveldat = data

            console.warn(world)

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
        }
      })
    })
  },
  skins: async () => {
    let allSkins = ''
    const skinIndex = JSON.parse(fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/skins/index.json`))
    skinIndex.forEach((skin, index) => {
      allSkins += `
        <skin skinfile="${skin.file}">
          <h4>${skin.name}</h4>
          <img onclick="changeSkin('${skin.file}')" style="cursor:pointer; "src="file://${getAppData()}/.Green_Lab-Client-MC/skins/${skin.file}" alt="${skin.name}" />
        </skin>
      `
    })

    return `
      <ul class="top-nav">
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').hide();$$('.myskins').show()"" class="active">My Skins</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').show();$$('.myskins').hide()">Browse Skins</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').hide();$$('.myskins').hide()">Skin Editor</li>
        <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').hide();$$('.myskins').hide()">Add Skin</li>
      </ul>
      <div class="content">
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
    let aternosLoginData = null
    const logInScreen = ``
    try {
      aternosLoginData = JSON.parse(fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/aternos.login.json`))
    } catch {
      return logInScreen
    }
  },
  about: async () => {
    return `
      <div class="content">
        <h1>About Green_Lab Client</h1>
        <h3>Developed by Green_Lab</h3>

        <h2>Thanks to...</h2>
        <ul>
          <li><a onclick="event.preventDefault();opn(this.href)" href="https://crafatar.com">Crafatar</a> for providing avatars</li>
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

/* global $ */
function reloadLauncher () {
  $.page.refresh()
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

$$('body').style.backgroundImage = `url('${random.choose(pictures)}.png')`
$$('body').style.backgroundSize = 'cover'

const fs = require('fs')
const atob = require('atob')

const directory = path.join(getAppData(), '.Green_Lab-Client-MC')

if (!fs.existsSync(directory)) fs.mkdirSync(directory)
if (!fs.existsSync(`${directory}/lastVersion.optifine`)) fs.writeFileSync(`${directory}/lastVersion.optifine`, 'NOT_INSTALLED')
if (!fs.existsSync(path.join(directory, 'skins'))) fs.mkdirSync(path.join(directory, 'skins'))
if (!fs.existsSync(path.join(directory, 'skins/index.json'))) fs.writeFileSync(path.join(directory, 'skins/index.json'), '[]')
getOptifineDownloadURL().then(optiFineURL => {
  if (fs.readFileSync(`${directory}/lastVersion.optifine`).toString('utf-8') !== optiFineURL.split('&')[0]) {
    console.log('Installing OptiFine')
    dlFile(optiFineURL, `${directory}/optifine.jar`, () => {
      console.log('Successfully installed OptiFine')
      fs.writeFileSync(`${directory}/lastVersion.optifine`, optiFineURL.split('&')[0])
    }, console.log)
  } else {
    console.log('OptiFine is already installed')
  }
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
    getUUID(getAccount().name, (uuid) => {
      callbackfunc(`https://crafatar.com/renders/head/${uuid}`)
    })
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
    }

    // return getAccount().name
    waitfor(zGET({ url: `https://api.mojang.com/users/profiles/minecraft/${getAccount().name}` }), (v) => {
      cb(JSON.parse(v).name)
    })
  }
}

const a = () => {
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
