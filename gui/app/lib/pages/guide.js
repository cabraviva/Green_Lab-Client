/* global $ */

module.exports = async _ => {
  return `
    <ul class="top-nav">
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.mcwiki').show()" class="active">Wiki</li>
      <!-- <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.mcwiki').hide()">Videos</li> -->
    </ul>

    <div class="mcwiki">
      <webview src="https://minecraft.fandom.com${$.lang.toLowerCase().includes('de') ? '/de' : ''}/wiki/Minecraft_Wiki" frameborder="0" style="
        position: fixed;
        top: 10vh;
        height: 90vh;
        width: 75vw;
        right: 0vw;
      "></webview>
    </div>
  `
}
