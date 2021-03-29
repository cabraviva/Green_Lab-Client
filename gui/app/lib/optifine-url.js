/* global fetch */

async function getOptifineDownloadURL () {
  const _response = (await (await fetch('https://optifine.net/downloads')).text())
  const dlcontainer = document.createElement('div')
  dlcontainer.innerHTML = _response.replace(/<img(.*?)>/g, '')
  const a = dlcontainer.querySelector('.downloadTable.mainTable tr .colDownload a')
  const splittedA = a.href.split('&url=')[1]
  const response = (await (await fetch(splittedA)).text())
  const c = document.createElement('div')
  c.innerHTML = response.replace(/<img(.*?)>/g, '')
  const dlurl = `https://optifine.net/downloadx${c.querySelector('.tableDownload tr .downloadButton a').href.split('/downloadx')[1]}`
  return dlurl
}

module.exports = getOptifineDownloadURL
