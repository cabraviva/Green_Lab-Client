/* global waitfor, io, zGET, $$, socket, skinview3d, fetch */

const { /* isWin, */ getAppData } = require('./glc-path')
const { getAccount } = require('./mcapi')
const fs = require('fs')
const { getAccessTokenForMC } = require('./mcapi')
const path = require('path')
const { atob } = require('./b64')
const directory = path.join(getAppData(), '.Green_Lab-Client-MC')
const { jsonFetch } = require('./http')
const {
  addFriend,
  isMyFriend
} = require('./glc-online-funcs')

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

        <body style="background:url('pictures/mansion.png');background-size:cover;">
            <div><h1>Login</h1></div>
            <div><input type="text" placeholder="InGame-Name" /></div>
            <div><input type="email" placeholder="E-Mail" /></div>
            <div><input type="password" placeholder="Passwor${window.isGerman() ? 't' : 'd'}" /></div>

            <div><button onclick="setAccount(document.querySelectorAll('div input')[0].value, document.querySelectorAll('div input')[1].value, document.querySelectorAll('div input')[2].value);location.reload()">Login</button></div>
            <div><h2 style="font-size:300%;color:#7a7a7a;">OR</h2></div>

            <div><button onclick="main.emit('msmc', 'select_account', (accessToken, profile) => {setAccount(profile.name, 'MSLOGIN', 'MSLOGIN');location.reload()})">Login with Microsoft</button></div>

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

            const notification = new window.PushNotification(window.isGerman() ? 'Akzeptierte Freundschaftsanfrage' : 'Accepted Friend Request', {
              body: window.isGerman() ? `${newFriend} ist jetzt dein Freund!` : `${newFriend} is now your friend!`
            })

            notification.send()
          })

          socket.on('chatMessage', ({ message, from }) => {
            if (!isMyFriend(from)) return

            const notification = new window.PushNotification(window.isGerman() ? `Neue Nachricht von ${from}` : `New message by ${from}`, {
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
            const notification = new window.PushNotification(window.isGerman() ? 'Neue Freundschaftsanfrage' : 'New Friend Request', {
              body: `${friendRequest.from} ${window.isGerman() ? 'möchte dein Freund sein' : 'wants to be your friend'}!`,
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
                    <button class="accept" onclick="addFriend('${friendRequest.from}');sendAcceptFriendNotification('${friendRequest.from}');this.parentElement.parentElement.outerHTML=''"><i class="fas fa-check"></i> ${window.isGerman() ? 'Annehmen' : 'Accept'}</button>
                    <button class="ignore" onclick="this.parentElement.parentElement.outerHTML=''"><i class="fas fa-arrow-up"></i> ${window.isGerman() ? 'Ignorieren' : 'Ignore'}</button>
                    <button class="block" onclick="blockFriend('${friendRequest.from}');this.parentElement.parentElement.outerHTML=''"><i class="fas fa-ban"></i> ${window.isGerman() ? 'Blockieren' : 'Block'}</button>
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

module.exports = sets
