/* global fetch */

(async () => {
  let banned = false
  try {
    const isOffline_ = await fetch('https://greenlabclient.greencoder001.repl.co/offline/')
    const isOffline = (await isOffline_.text()) !== 'false'
    banned = isOffline
  } catch {
    banned = true
  }

  window.banned = banned

  require('./renderer.js')
})()
