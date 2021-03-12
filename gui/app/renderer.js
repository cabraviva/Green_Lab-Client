/* global waitfor, zGET, XMLHttpRequest, $$ */
const random = require('./random.js')
const getOptifineDownloadURL = require('./optifine-url.js')
const dlFile = require('./dlfile.js')
const axios = require('axios')

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
      <h1>Game</h1>
    `
  }
}

loadPage(currentPage)

const pictures = [
  'mansion',
  'snow',
  'underwater',
  'swamp',
  'dungeon',
  'endcity'
]

$$('body').style.backgroundImage = `url('${random.choose(pictures)}.png')`

const fs = require('fs')
const atob = require('atob')

const directory = `${require('os').homedir()}\\AppData\\Roaming\\.Green_Lab-Client-MC`

if (!fs.existsSync(directory)) fs.mkdirSync(directory)
if (!fs.existsSync(`${directory}\\lastVersion.optifine`)) fs.writeFileSync(`${directory}\\lastVersion.optifine`, 'NOT_INSTALLED')

getOptifineDownloadURL().then(optiFineURL => {
  if (fs.readFileSync(`${directory}\\lastVersion.optifine`).toString('utf-8') !== optiFineURL.split('&')[0]) {
    console.log('Installing OptiFine')
    dlFile(optiFineURL, `${directory}\\optifine.jar`, () => {
      console.log('Successfully installed OptiFine')
      fs.writeFileSync(`${directory}\\lastVersion.optifine`, optiFineURL.split('&')[0])
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

function getHead (cb) {
  getSkin((url) => {
    // waitfor(zGET({ url: url }), (img) => {
    //   console.log(new Uint8Array(img))
    // })

    const req = new XMLHttpRequest()

    req.responseType = 'arraybuffer'
    req.addEventListener('load', (e) => {
      const arrayBuffer = e.target.response

      if (!arrayBuffer) {
        throw new Error('No response')
      }

      // this the the byte array to decode
      const byteArray = new Uint8Array(arrayBuffer)

      const signature = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]

      for (let i = 0; i < signature.length; i++) {
        if (byteArray[i] !== signature[i]) {
          return false
        }
      }
    })

    req.open('GET', url, true)
    req.send()
  })
}

var sets = {
  skin: function (cb) {
    getSkin(v => {
      cb(`background-image:url(${v})`)
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
