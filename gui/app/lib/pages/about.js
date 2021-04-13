const isGerman = require('../lang.js')
const fs = require('fs')
const path = require('path')
const getAppData = window.__getAppData
const directory = path.join(getAppData(), '.Green_Lab-Client-MC')

module.exports = async () => {
  return `
    <div class="content">
      <h1>${isGerman() ? 'Über Green_Lab Client' : 'About Green_Lab Client'}</h1>
      <h3>${isGerman() ? 'Entwickelt von' : 'Developed by'} Green_Lab</h3>
      <h3>Version: ${window.getVersion()}</h3>

      <h2>${isGerman() ? 'Danke an...' : 'Thanks to...'}</h2>
      <ul>
        <li><a onclick="event.preventDefault();opn(this.href)" href="https://github.com/bs-community/skinview3d">SkinView3D</a> ${isGerman() ? 'und' : 'and'} <a onclick="event.preventDefault();opn(this.href)" href="https://threejs.org">Three.js</a> ${isGerman() ? 'für die Skin Vorschau' : 'for the skin viewer'}</li>
        <li><a onclick="event.preventDefault();opn(this.href)" href="https://www.electronjs.org">Electron</a> ${isGerman() ? 'für das coole Framework, um den Client zu erstellen' : 'for the cool framework to create the app'}</li>
        <li><a onclick="event.preventDefault();opn(this.href)" href="https://github.com/Pierce01/MinecraftLauncher-core#readme">minecraft-launcher-core</a> ${isGerman() ? 'für das NPM Modul, welches es erst möglich machte, Minecraft zu starten' : 'for the npm module, to make it possible to run Minecraft'}</li>
        <li><a onclick="event.preventDefault();opn(this.href)" href="https://www.gommehd.net/player/index?playerName=Rico_der_Pinguin">Rico_der_Pinguin</a> ${isGerman() ? 'und' : 'and'} <a onclick="event.preventDefault();opn(this.href)" href="https://twitch.tv/scuffipuffi">Scuffipuffi</a> ${isGerman() ? 'für das testen des Clients' : 'for testing the client'}</li>
      </ul>

      GLC Online <label class="switch"><input oninput="if(this.checked){enableGLC()}else{disableGLC()};$.storage.session.set('callPage', 'about');setTimeout($.page.refresh, 1000)" type="checkbox"${(fs.readFileSync(path.join(directory, 'glc-online', '.enabled')).toString('utf-8') === 'true') ? ' checked' : ''}><span class="slider round"></span></label><br /><br />
      ${isGerman() ? 'Englische Version des Clients' : 'Use only english language'} <label class="switch"><input oninput="$.storage.session.set('callPage', 'about');if(this.checked){setTimeout(enableEnglishOnly, 1000)}else{setTimeout(disableEnglishOnly, 1000)}" type="checkbox"${(fs.readFileSync(path.join(directory, 'english-only.enabled')).toString('utf-8') === 'true') ? ' checked' : ''}><span class="slider round"></span></label><br /><br />
      ${isGerman() ? 'Freundschaftsanfragen' : 'Receive friend requests'} <label class="switch"><input oninput="$.storage.session.set('callPage', 'about');if(this.checked){enableFR()}else{disableFR()};setTimeout($.page.refresh, 1000)" type="checkbox"${(fs.readFileSync((path.join(directory, 'glc-online', 'fr.enabled'))).toString('utf-8') === 'true') ? ' checked' : ''}><span class="slider round"></span></label><br /><br />
    </div>
  `
}
