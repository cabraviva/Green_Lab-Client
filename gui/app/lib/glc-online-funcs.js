/* global socket */

const fs = require('fs')
const path = require('path')
const { /* isWin, */ getAppData } = require('./glc-path')
const directory = path.join(getAppData(), '.Green_Lab-Client-MC')

// Start GLC-Online
if (!fs.existsSync(path.join(directory, 'glc-online'))) fs.mkdirSync(path.join(directory, 'glc-online'))
if (!fs.existsSync(path.join(directory, 'glc-online', '.enabled'))) fs.writeFileSync(path.join(directory, 'glc-online', '.enabled'), 'true')
if (!fs.existsSync(path.join(directory, 'glc-online', 'friends.json'))) fs.writeFileSync(path.join(directory, 'glc-online', 'friends.json'), '[]')
if (!fs.existsSync(path.join(directory, 'glc-online', 'blocked.json'))) fs.writeFileSync(path.join(directory, 'glc-online', 'blocked.json'), '[]')
if (!fs.existsSync(path.join(directory, 'glc-online', 'fr.enabled'))) fs.writeFileSync(path.join(directory, 'glc-online', 'fr.enabled'), 'true')
if (!fs.existsSync(path.join(directory, 'english-only.enabled'))) window.disableEnglishOnly()

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
  window.skinViewHandler()
}

function removeFriend (ign) {
  let friends = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'friends.json')).toString('utf-8'))
  friends = friends.filter(friend => friend !== ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'friends.json'), JSON.stringify(friends))
  window.skinViewHandler()
}

function blockFriend (ign) {
  removeFriend(ign)
  const blocked = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'blocked.json')).toString('utf-8'))
  blocked.push(ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'blocked.json'), JSON.stringify(blocked))
  window.skinViewHandler()
}

function unblockFriend (ign) {
  let blocked = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'blocked.json')).toString('utf-8'))
  blocked = blocked.filter(_blocked => _blocked !== ign)
  fs.writeFileSync(path.join(directory, 'glc-online', 'blocked.json'), JSON.stringify(blocked))
  window.skinViewHandler()
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

module.exports = {
  addFriend,
  blockFriend,
  unblockFriend,
  enableGLC,
  disableGLC,
  enableFR,
  disableFR,
  isMyFriend,
  requestFriend,
  sendAcceptFriendNotification,
  sendChatMessage
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
