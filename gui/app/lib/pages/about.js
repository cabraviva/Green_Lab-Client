const isGerman = require('../lang.js')

module.exports = async () => {
  return `
    <div class="content">
      <h1>${isGerman() ? 'Über Green_Lab Client' : 'About Green_Lab Client'}</h1>
      <h3>${isGerman() ? 'Entwickelt von' : 'Developed by'} Green_Lab</h3>

      <h2>${isGerman() ? 'Danke an...' : 'Thanks to...'}</h2>
      <ul>
        <li><a onclick="event.preventDefault();opn(this.href)" href="https://github.com/bs-community/skinview3d">SkinView3D</a> ${isGerman() ? 'und' : 'and'} <a onclick="event.preventDefault();opn(this.href)" href="https://threejs.org">Three.js</a> ${isGerman() ? 'für die Skin Vorschau' : 'for the skin viewer'}</li>
        <li><a onclick="event.preventDefault();opn(this.href)" href="https://www.electronjs.org">Electron</a> ${isGerman() ? 'für das coole Framework, um den Client zu erstellen' : 'for the cool framework to create the app'}</li>
        <li><a onclick="event.preventDefault();opn(this.href)" href="https://github.com/Pierce01/MinecraftLauncher-core#readme">minecraft-launcher-core</a> ${isGerman() ? 'für das NPM Modul, welches es erst möglich machte, Minecraft zu starten' : 'for the npm module, to make it possible to run Minecraft'}</li>
      </ul>
    </div>
  `
}
