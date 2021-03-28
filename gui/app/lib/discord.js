// const dcClientID = '777488569345769482'
// const DiscordRPC = require('discord-urpc')
// window.dcClientID = dcClientID
//
// function run () {
//   const uRPC = new DiscordRPC({ clientID: dcClientID, debug: true })
//
//   uRPC.on('ready', () => {
//     console.log('Dicord RPC connected')
//   })
// }
//
// module.exports = {
//   run
// }

module.exports = {
  getActivity: () => {
    return require('electron').remote.getGlobal('activity')
  },

  setActivity: (activity) => {
    const _activity = require('electron').remote.getGlobal('activity')
    _activity.state = activity.state
    _activity.details = activity.details
    _activity.largeImageKey = activity.largeImageKey
    _activity.smallImageKey = activity.smallImageKey
    _activity.startTimestamp = activity.startTimestamp
    return _activity
  }
}
