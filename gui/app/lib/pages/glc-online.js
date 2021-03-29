const isGerman = require('../lang.js')
const fs = require('fs')
const path = require('path')
const { getAppData } = require('../glc-path')
const directory = path.join(getAppData(), '.Green_Lab-Client-MC')

// Views
const { friendView, partyView } = require('./glc-online-views')

module.exports = async () => {
  // GLC-Online
  if (fs.readFileSync((path.join(directory, 'glc-online', '.enabled'))).toString('utf-8') !== 'true') {
    return `
      <div class="content">
        <h1>GLC Online</h1>
        <p>
          ${isGerman() ? 'GLC Online ist ein Zusatz-Dienst, der genutzt werden kann um partys zu erstellen und mit Freunden Minecraft zu spielen. Du hast ihn leider deaktiviert 🙁' : 'GLC Online is a service to play Minecraft with your friends and create parties. To use it activate it in the settings.'}
        </p>
      </div>
    `
  }

  return `
    <ul class="top-nav">
      <li onlick="$$('.friends').show();$$('.parties').hide()" class="active">${isGerman() ? 'Freunde' : 'Friends'}</li>
      <li onlick="$$('.friends').hide();$$('.parties').show()">${isGerman() ? 'Partys' : 'Parties'}</li>
    </ul>
    <div class="content">
      <div class="friends">
        ${await friendView()}
      </div>
      <div class="parties" style="display:none;">
        ${await partyView()}
      </div>
    </div>
  `
}
