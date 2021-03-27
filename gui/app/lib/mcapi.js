/* global zGET, waitfor, $, $$ */
const fs = require('fs')
const { atob, btoa } = require('./b64')
const path = require('path')
const { getAppData } = require('./glc-path')
const axios = require('axios')
const mojang = require('mojang')

const directory = path.join(getAppData(), '.Green_Lab-Client-MC')

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

function getUUID (name, cb) {
  try {
    waitfor(zGET({ url: `https://api.mojang.com/users/profiles/minecraft/${getAccount().name}` }), (v) => {
      cb(JSON.parse(v).id)
    })
  } catch {
    $.page.refresh()
  }
}

function getSkin (cb) {
  getUUID(getAccount().name, (uuid) => {
    waitfor(zGET({ url: `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}` }), (v) => {
      cb(JSON.parse(atob(JSON.parse(v).properties[0].value)).textures.SKIN.url)
    })
  })
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
          window.skin = new window.skinview3d.SkinViewer({
            canvas: $$('#skinView'),
            width: Math.floor(window.innerWidth / 7),
            height: Math.floor(window.innerHeight / 5),
            skin: skinURL
          })

          const control = window.skinview3d.createOrbitControls(window.skin)
          control.enableRotate = false
          control.enableZoom = false
          control.enablePan = false

          const walkAnimation = window.skin.animations.add(window.skinview3d.WalkingAnimation)
          walkAnimation.speed = 1
        })
      }).catch((err) => {
        if (window.isGerman()) {
          window.alert(`Fehler: Der Skin ${skinID} wurde nicht von Minecraft akzeptiert. Bitte wähle einen anderen Skin aus`)
        } else {
          window.alert('Skin Error: The Skin ' + skinID + ' is not valid. Please chosse an other Skin')
        }
        console.error(err)
      })
    }).catch(() => {
      if ((fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`).toString('utf-8') === 'NOT_LOGGED_IN')) {
        fs.writeFileSync(`${getAppData()}/.Green_Lab-Client-MC/account.json`, 'NOT_LOGGED_IN')
        window.reloadLauncher()
      }
    })
  })
}

module.exports = { getSkin, getUUID, getAccount, setAccount, directory, getAccessTokenForMC, changeSkin }
