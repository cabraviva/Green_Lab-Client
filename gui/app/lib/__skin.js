/* global waitFor, $$, zGET */

const { /* isWin, */ getAppData } = require('./glc-path')
const path = require('path')
const directory = path.join(getAppData(), '.Green_Lab-Client-MC')
const fs = require('fs')

function searchForSkin (q) {
  console.log('[SKINS] Searching for ' + q)
  $$('skinbox.bs ul').innerHTML = `<h1>${window.isGerman() ? 'Suche nach' : 'Searching for'} ${q} Skins</h1>`
  waitFor(zGET({ url: `http://minecraft.novaskin.me/search?q=model:Player+${encodeURIComponent(q)}&json=true` }), (skinlist) => {
    skinlist = JSON.parse(skinlist)
    const skins = skinlist.skins
    $$('skinbox.bs ul').innerHTML = ''
    skins.forEach((skin, indexOfSkin) => {
      $$('skinbox.bs ul').innerHTML += `
        <li>
          <skin skinurl="${skin.url}">
            <h4>${skin.title}</h4>
            <img style="cursor:pointer;" onclick="addSkin('${skin.title}','${skin.url}')" src="${skin.screenshot}" alt="${skin.title}" />
          </skin>
        </li>
      `
    })
  })
}

function changeSkinName (skinIndexID, newName) {
  const skinDex = JSON.parse(fs.readFileSync(`${directory}/skins/index.json`).toString('utf-8'))
  skinDex[skinIndexID].name = newName
  fs.writeFileSync(`${directory}/skins/index.json`, JSON.stringify(skinDex))
}

function delSkin (skinIndexID) {
  let skinDex = JSON.parse(fs.readFileSync(`${directory}/skins/index.json`).toString('utf-8'))
  skinDex = skinDex.filter((_foo, i) => { return i !== skinIndexID })
  fs.writeFileSync(`${directory}/skins/index.json`, JSON.stringify(skinDex))
}

function editSkin (name, file) {
  name = decodeURIComponent(name)
  file = decodeURIComponent(file)
  console.log(`[SKINS] Editing ${name}`)
  const popup = document.createElement('div')
  popup.classList.add('popup')
  let indexOfTheSkin = 0

  const skinFilter = (elem, i) => {
    if (elem.name === name && elem.file === file) indexOfTheSkin = i
    return elem.name === name && elem.file === file
  }

  const skinDex = JSON.parse(fs.readFileSync(`${directory}/skins/index.json`).toString('utf-8'))
  skinDex.filter(skinFilter)

  popup.innerHTML = `
    <i onclick="this.parentElement.outerHTML='';reloadLauncher()" class="fas fa-chevron-left choose_this" style="position:fixed;top:6vh;left:1vw;"></i>
    <h1 style="text-align:center"><input type="text" value="${name}" oninput="changeSkinName(${indexOfTheSkin},this.value)" /></h1>
    <i onclick="delSkin(${indexOfTheSkin});reloadLauncher()" class="fas fa-trash choose_this" style="position:fixed;top:6vh;right:1vw;color:#a80d0d;"></i>
  `

  $$('body').append(popup)
}

module.exports = { editSkin, delSkin, changeSkinName, searchForSkin }
