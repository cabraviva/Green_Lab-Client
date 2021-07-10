/* global $ */

const fs = require('fs')
const { getAppData } = require('../glc-path')
const isGerman = require('../lang.js')
const { jsonFetch } = require('../http')

const countLength = (arr, max = 6) => Math.ceil(arr.length / max)

const countPages = (num = 6, page = 0) => {
  const skinDex = JSON.parse(fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/skins/index.json`))
  const pagesCount = countLength(skinDex, num)
  return pagesCount
}

const getSessionSkinPage = () => parseInt($.storage.session.get('skinsp')) || 0
const setSessionSkinPage = (p = 0) => { $.storage.session.set('skinsp', p); return getSessionSkinPage() }

window.getSessionSkinPage = getSessionSkinPage
window.setSessionSkinPage = setSessionSkinPage
window.sCp = countPages

const showLeftArrow = cp => cp > 0
const showRightArrow = cp => { return countPages() - cp > 1 }

window.showLeftArrowS = showLeftArrow
window.showRightArrowS = showRightArrow

function getSkinIndex (num = 6, page = 0) {
  const skinDex = JSON.parse(fs.readFileSync(`${getAppData()}/.Green_Lab-Client-MC/skins/index.json`))
  const pages = []

  const pagesCount = countLength(skinDex, num)
  let pc = 0

  while (pc !== pagesCount) {
    pages.push((skinDex.slice(pc * num, (pc * num) + num)))
    pc += 1
  }

  return pages[page]
}

const listCosmetics = async () => {
  const cosmetics = await jsonFetch('https://greenlabclient.greencoder001.repl.co/skin-editor/cosmetics/list/')
  return cosmetics
}

async function getCosmeticByID (id) {
  return await jsonFetch(`https://greenlabclient.greencoder001.repl.co/skin-editor/cosmetics/view/${id}`)
}

const sfwd = () => {
  setSessionSkinPage(getSessionSkinPage() + 1)
}

const sbck = () => {
  setSessionSkinPage(getSessionSkinPage() - 1)
}

window.sfwd = sfwd
window.sbck = sbck

module.exports = async () => {
  let allSkins = ''
  const skinIndex = getSkinIndex(6, getSessionSkinPage())
  console.log(skinIndex)
  skinIndex.forEach((skin, index) => {
    if (skin === null) return
    allSkins += `
      <skin skinfile="${skin.file}">
        <h4 style="text-align:center;"><span onclick="changeSkin('${skin.file}')" class="choose_this">${skin.name}</span> <i class="fas fa-pen choose_this" onclick="editSkin('${encodeURIComponent(skin.name)}','${encodeURIComponent(skin.file)}')" title="${isGerman() ? `${skin.name} bearbeiten` : `Edit ${skin.name}`}"></i></h4>
        <canvas class="skin_view_chooser"></canvas>
      </skin>
    `
  })

  const cosmeticList = await listCosmetics()

  const skineditornaventries = {
    hair: '',
    skins: '',
    eyes: '',
    faces: '',
    clothes: '',
    arms: '',
    legs: '',
    accessoires: ''
  }

  for (const _cosmetic of cosmeticList.hairs) {
    const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
    skineditornaventries.hair += `
      <cosmeticentry cosmeticid="${_cosmetic.id}">
        <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
        <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
      </cosmeticentry>
    `
  }

  for (const _cosmetic of cosmeticList.skins) {
    const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
    skineditornaventries.skins += `
      <cosmeticentry cosmeticid="${_cosmetic.id}">
        <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
        <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
      </cosmeticentry>
    `
  }

  for (const _cosmetic of cosmeticList.eyes) {
    const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
    skineditornaventries.eyes += `
      <cosmeticentry cosmeticid="${_cosmetic.id}">
        <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
        <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
      </cosmeticentry>
    `
  }

  for (const _cosmetic of cosmeticList.faces) {
    const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
    skineditornaventries.faces += `
      <cosmeticentry cosmeticid="${_cosmetic.id}">
        <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
        <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
      </cosmeticentry>
    `
  }

  for (const _cosmetic of cosmeticList.clothes) {
    const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
    skineditornaventries.clothes += `
      <cosmeticentry cosmeticid="${_cosmetic.id}">
        <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
        <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
      </cosmeticentry>
    `
  }

  for (const _cosmetic of cosmeticList.arms) {
    const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
    skineditornaventries.arms += `
      <cosmeticentry cosmeticid="${_cosmetic.id}">
        <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
        <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
      </cosmeticentry>
    `
  }

  for (const _cosmetic of cosmeticList.legs) {
    const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
    skineditornaventries.legs += `
      <cosmeticentry cosmeticid="${_cosmetic.id}">
        <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
        <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
      </cosmeticentry>
    `
  }

  for (const _cosmetic of cosmeticList.accessoires) {
    const cosmeticInfo = await getCosmeticByID(_cosmetic.id)
    skineditornaventries.accessoires += `
      <cosmeticentry cosmeticid="${_cosmetic.id}">
        <cosmeticname>${cosmeticInfo.name} <i>by ${cosmeticInfo.creator}</i></cosmeticname>
        <img src="${cosmeticInfo.screenshot}" alt="${cosmeticInfo.name}" />
      </cosmeticentry>
    `
  }

  const skineditornav = `
    <skincategory>
      <h3>${isGerman() ? 'Frisuren' : 'Hair'}</h3>
      <skincategoryentries>
        <!--<cosmeticentry>
          <img src="" alt="" />
        </cosmeticentry>-->
        ${skineditornaventries.hair}
      </skincategoryentries>
    </skincategory>
  `

  return `
    <ul class="top-nav">
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').hide();$$('.myskins').show();$$('.skin-editor-container').hide()"" class="active">${isGerman() ? 'Meine' : 'My'} Skins</li>
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').show();$$('.myskins').hide();$$('.skin-editor-container').hide()">${isGerman() ? 'Skins durchsuchen' : 'Browse Skins'}</li>
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.browseonly').hide();$$('.myskins').hide();$$('.skin-editor-container').show()">Skin Editor</li>
      <li onclick="chooseLocalSkin()">${isGerman() ? 'Skin hinzufügen' : 'Add Skin'}</li>
    </ul>
    <div class="content">
      <div class="skin-editor-container" style="display:none;overflow:hidden;">
        <skineditornav>
          ${skineditornav}
        </skineditornav>
        <skineditorpreview>

        </skineditorpreview>
      </div>
      <div class="browseonly" style="display:none;">
        <skinsearch>
          <input type="text" class="searchForSkin"/>
          <button class="_b" onclick="searchForSkin($$('.searchForSkin').value)"><i class="fas fa-search"></i></button>
        </skinsearch>
        <skinbox class="bs"><ul></ul></skinbox>
      </div>
      <div class="myskins">
        <skinbox>
          <ul>
            ${allSkins}
          </ul>
          ${showLeftArrow(getSessionSkinPage()) ? '<i class="leftskinarrow fas fa-caret-left" onclick="sbck();reloadLauncher()"></i>' : ''}
          ${showRightArrow(getSessionSkinPage()) ? '<i class="rightskinarrow fas fa-caret-right" onclick="sfwd();reloadLauncher()"></i>' : ''}
        </skinbox>
      </div>
    </div>
  `
}
