const isGerman = require('../lang.js')

module.exports = async () => {
  return `
    <ul class="top-nav">
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').hide();$$('.snapshot').hide();$$('.news-feed').show()">Green_Lab Client</li>
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').show();$$('.snapshot').hide();$$('.news-feed').show()" class="active">OptiFine</li>
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').show();$$('.optifine').hide();$$('.snapshot').hide();$$('.news-feed').show()">Vanilla</li>
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').hide();$$('.snapshot').show();$$('.news-feed').show()">Snapshot</li>
      <li onclick="$$('.top-nav li').removeClass('active');this.classList.add('active');$$('.vanilla').hide();$$('.optifine').hide();$$('.snapshot').hide();$$('.news-feed').hide()">Custom</li>
    </ul>
    <div class="content optifine" style="overflow:hidden;padding:0;margin:0">
      <div class="flexer">
        <centeredplaybtn onclick="if(runningVanilla==false){$$('centeredplaybtn').any('innerText', '${isGerman() ? 'Spiel läuft bereits' : 'Runnning'}');runningVanilla=true;launchOptiFine()}">${!window.runningVanilla ? (isGerman() ? 'Spielen' : 'Play') : (isGerman() ? 'Spiel läuft bereits' : 'Running')}</centeredplaybtn>
      </div>
    </div>
    <div class="content vanilla" style="overflow:hidden;padding:0;margin:0;display:none;">
      <div class="flexer">
        <centeredplaybtn onclick="if(runningVanilla==false){$$('centeredplaybtn').any('innerText', '${isGerman() ? 'Spiel läuft bereits' : 'Runnning'}');runningVanilla=true;launchVanilla()}">${isGerman() ? 'Spielen' : 'Play'}</centeredplaybtn>
      </div>
    </div>
    <div class="content snapshot" style="overflow:hidden;padding:0;margin:0;display:none;">
      <div class="flexer">
        <centeredplaybtn onclick="if(runningVanilla==false){$$('centeredplaybtn').any('innerText', '${isGerman() ? 'Spiel läuft bereits' : 'Runnning'}');runningVanilla=true;launchSnapshot()}">${!window.runningVanilla ? (isGerman() ? 'Spielen' : 'Play') : (isGerman() ? 'Spiel läuft bereits' : 'Running')}</centeredplaybtn>
      </div>
    </div>

    <div class="content glc" style="overflow:hidden;padding:0;margin:0;display:none;">
      <div class="flexer">
        <centeredplaybtn onclick="if(runningVanilla==false){$$('centeredplaybtn').any('innerText', '${isGerman() ? 'Spiel läuft bereits' : 'Runnning'}');runningVanilla=true;launchSnapshot()}">${!window.runningVanilla ? (isGerman() ? 'Spielen' : 'Play') : (isGerman() ? 'Spiel läuft bereits' : 'Running')}</centeredplaybtn>
      </div>
    </div>

    <iframe class="hoverflow news-feed" src="https://greenlabclient.greencoder001.repl.co/snapshots/latest/" style="
      position: fixed;
      top: 15vh;
      height: 80vh;
      width: 20vw;
      right: 3vw;
    "></iframe>

    <div class="twittget news-feed"><a data-theme="dark" data-chrome="transparent" class="twitter-timeline" href="https://twitter.com/Minecraft?ref_src=twsrc%5Etfw">Tweets by Minecraft</a></div>
  `
}
