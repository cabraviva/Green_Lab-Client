/* global $ */

module.exports = async _ => {
  return `
    <iframe src="https://minecraft.fandom.com${$.lang.toLowerCase().includes('de') ? '/de' : ''}/wiki/Minecraft_Wiki" frameborder="0" style="
      position: fixed;
      top: 5vh;
      height: 95vh;
      width: 75vw;
      right: 0vw;
    "></iframe>
  `
}
