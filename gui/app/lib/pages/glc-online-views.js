const fs = require('fs')
const path = require('path')
const { getAppData } = require('../glc-path.js')
const directory = path.join(getAppData(), '.Green_Lab-Client-MC')
const isGerman = require('../lang.js')
const { asyncOnlineCheck } = require('../online-check')

async function friendView () {
  let final = `
    <notskinsearch>
      <input type="text" class="addfriendclass">
      <button class="_b __add-btn" onclick="requestFriend($$('.addfriendclass').value);$$('.addfriendclass').value='';$$('.addfriendclass').focus()"><i class="fas fa-plus"></i></button>
    </notskinsearch>
  `

  const friends = JSON.parse(fs.readFileSync(path.join(directory, 'glc-online', 'friends.json')))

  for (const friend of friends) {
    final += `
      <div class="friend-view" style="margin-bottom:2vh;">
        <h2>${friend} ${await asyncOnlineCheck(friend)} <i onclick="removeFriend('${friend}');skinViewHandler()" class="trash-btn fas fa-trash"></i></h2>
        <input onkeypress="if(event.charCode===13){sendChatMessage('${friend}',this.parentElement.querySelector('input').value);this.parentElement.querySelector('input').value='';this.parentElement.querySelector('input').focus()}" type="text" placeholder="${isGerman() ? 'Eine Nachricht senden' : 'Send a message'}" />
        <button class="special-button" onclick="sendChatMessage('${friend}',this.parentElement.querySelector('input').value);this.parentElement.querySelector('input').value='';this.parentElement.querySelector('input').focus()">${isGerman() ? 'Senden' : 'Send'}</button>
      </div>
    `
  }

  return final
}

async function partyView () {

}

module.exports = { friendView, partyView }
