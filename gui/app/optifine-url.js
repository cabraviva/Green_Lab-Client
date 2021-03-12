/* global fetch */

function getOptifineDownloadURL () {
  return new Promise((resolve, reject) => {
    fetch('https://optifine.net/downloads').then((response) => {
      const dlcontainer = document.createElement('div')
      response.text().then(txtA => {
        dlcontainer.innerHTML = txtA.replace(/<img(.*?)>/g, '')
        const a = dlcontainer.querySelector('.downloadTable.mainTable tr .colDownload a')
        const splittedA = a.href.split('/')
        fetch(`https://${splittedA[7]}/${splittedA[8]}`).then(dlScreen => {
          dlScreen.text().then(dlScrn => {
            const c = document.createElement('div')
            c.innerHTML = dlScrn.replace(/<img(.*?)>/g, '')
            const dlurl = `https://optifine.net/${c.querySelector('#Download a').href.split('/')[11]}`
            resolve(dlurl)
          })
        })
      })
    })
  })
}

module.exports = getOptifineDownloadURL
