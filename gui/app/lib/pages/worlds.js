const { walk } = require('../fs-plus')
const path = require('path')
const { getAppData } = require('../glc-path')
const nbt = require('nbt')
const fs = require('fs')
const isGerman = require('../lang.js')

async function allWorlds (cb) {
  for await (const p of walk(path.join(getAppData(), '.minecraft/saves'))) {
    cb(p)
  }
}

module.exports = () => {
  return new Promise((resolve, reject) => {
    let final = ''
    let worlds = []
    allWorlds(w => {
      worlds.push(w)
    }).then(() => {
      worlds = worlds.filter((elem) => { return !elem.endsWith('.zip') })
      let i = 0
      for (const world of worlds) {
        try {
          let leveldat = null
          nbt.parse(fs.readFileSync(path.join(world, 'level.dat')), (err, data) => {
            if (err) {
              if (isGerman()) {
                return reject(window.alert(`Ein Fehler ist aufgetreten! INVALID_LEVELDAT_NBT. Bitte melde diesen Fehler auf https://github.com/greeencoder001/Green_Lab-Client/issues/new. Weitere Informationen: ${world}\nProbiere auch den Ordner der Welt zu löschen.`))
              }
              return reject(window.alert('An error occurs! INVALID_LEVELDAT_NBT. Please report this issue on https://github.com/greencoder001/Green_Lab-Client/issues/new. FURTHER INFORMATION: ' + world + '\nYou can also try to delete the folder with the world.'))
            }
            leveldat = data

            final += `
              <div class="world">
                <h2>${leveldat.value.Data.value.LevelName.value}</h2>
                <span class="version">${(leveldat?.value?.Data?.value?.Version?.value?.Name?.value) || (isGerman() ? 'Unbekannte Version' : 'Unknown Version')}</span>
              </div>
            `
            i += 1

            if (i >= worlds.length) {
              resolve(`
                <div class="content">
                  ${final}
                </div>
              `)
            }
          })
        } catch (err) {
          console.warn('Error: Reading World ' + world + ' failed')
          // window.alert('An error occurs! INVALID_WORLD. Please report this issue on https://github.com/greencoder001/Green_Lab-Client/issues/new. FURTHER INFORMATION: ' + world + ' [See Console] \nYou can also try to delete the folder with the world.')
          i += 1
          if (i >= worlds.length) {
            resolve(`
              <div class="content">
                ${final}
              </div>
            `)
          }
        }
      }
    })
  })
}
