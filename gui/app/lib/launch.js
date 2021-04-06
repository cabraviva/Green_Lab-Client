/* global fetch, $$ */

const { Client, Authenticator } = require('minecraft-launcher-core')
const os = require('os-utils')
const { getAccount } = require('./mcapi')
const path = require('path')
const { /* isWin, */ getAppData } = require('./glc-path')
const win = require('./win.js')
const dc = require('./discord')
const fs = require('fs')

async function getLatestVersion () {
  const launchermeta = await (await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json')).json()
  return launchermeta.latest.release
  // return JSON.parse(fs.readFileSync(path.join(getAppData(), path.join('.minecraft', 'versions/version_manifest_v2.json')))).latest
}

function mcRam () {
  return {
    min: (Math.round(Math.round(os.totalmem()) / 1024) / 2) - (Math.round(Math.round(os.totalmem()) / 3 / 1024)),
    max: (Math.round(Math.round(os.totalmem()) / 1024) / 2)
  }
}

function auth () {
  const acc = getAccount()
  return Authenticator.getAuth(acc.email, acc.pw)
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
      window.runningVanilla = false
      $$('centeredplaybtn').any('innerText', window.isGerman() ? 'Spielen' : 'Play')
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
      window.runningVanilla = false
      $$('centeredplaybtn').any('innerText', window.isGerman() ? 'Spielen' : 'Play')
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

async function $launchSnapshot (snapshotID = '') {
  launchVanilla('', { number: '21w13a', type: 'snapshot' })
}

async function launchSnapshot () {
  $launchSnapshot(fs.readFileSync(path.join(getAppData(), '.Green_Lab-Client-MC', 'latest.snapshot')).toString('utf-8'))
}

module.exports = { launchVanilla, launchOptiFine, launchSnapshot }
