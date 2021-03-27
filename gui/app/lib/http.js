/* global fetch */

async function getLatestMCJSON () {
  return (JSON.stringify((await jsonFetch((await getLatest()).url))))
}

async function jsonFetch (url) {
  return await (await fetch(url)).json()
}

async function getLatest () {
  const launchermeta = await (await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json')).json()
  return launchermeta.versions.filter((version) => { return version.id === launchermeta.latest.release })[0]
}

module.exports = { jsonFetch, getLatestMCJSON, getLatest }
