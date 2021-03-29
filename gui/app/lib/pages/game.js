const isGerman = require('../lang.js')

module.exports = async () => {
  return `
    <ul class="top-nav">
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').hide()">Green_Lab Client</li>
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').show()" class="active">OptiFine</li>
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').show();$$('.optifine').hide()">Vanilla</li>
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').hide()">Custom</li>
    </ul>
    <div class="content optifine" style="overflow:hidden;padding:0;margin:0">
      <div class="flexer">
        <centeredplaybtn onclick="if(runningVanilla==false){$$('centeredplaybtn').any('innerText', '${isGerman() ? 'Spiel läuft bereits' : 'Runnning'}');runningVanilla=true;launchOptiFine()}">${isGerman() ? 'Spielen' : 'Play'}</centeredplaybtn>
      </div>
    </div>
    <div class="content vanilla" style="overflow:hidden;padding:0;margin:0;display:none;">
      <div class="flexer">
        <centeredplaybtn onclick="if(runningVanilla==false){$$('centeredplaybtn').any('innerText', '${isGerman() ? 'Spiel läuft bereits' : 'Runnning'}');runningVanilla=true;launchVanilla()}">${isGerman() ? 'Spielen' : 'Play'}</centeredplaybtn>
      </div>
    </div>
  `
}
