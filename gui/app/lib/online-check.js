function onlineCheck (ign, cbf) {
  if (!window.socket) return cbf('?')
  window.socket.emit('isOnline', ign, _state => {
    const { state } = _state
    console.log(`Received State for ${_state.for}: ${state}`)
    if (state === 'afk') cbf('<i style="color:#da8315;" class="fas fa-moon"></i>')
    if (state === 'inGame') cbf('<i style="color:#14e678;" class="fas fa-gamepad"></i>')
    if (state === true) cbf('<i style="color:#14e678;" class="fas fa-circle"></i>')
    if (state === false) cbf('<i style="color:#af3c1a;" class="fas fa-circle"></i>')
  })
}

function asyncOnlineCheck (ign) {
  return new Promise(function (resolve, reject) {
    onlineCheck(ign, resolve)
  })
}

module.exports = { onlineCheck, asyncOnlineCheck }
