/* global ngrok, PushNotification, isGerman */

const { clipboard } = require('electron')

class OpenToWorld {
  constructor (port) {
    this.port = port
    console.log(`[OTW] Constructed OTW on Port ${this.port}`)
  }

  async tunnel () {
    this.tunnelurl = (await ngrok.connect({ proto: 'tcp', addr: this.port, region: 'eu' })).replace('tcp://', '')
    return this
  }
}

const openToWorld = async port => {
  const server = new OpenToWorld(port)
  const owt = await server.tunnel()
  const url = owt.tunnelurl

  clipboard.writeText(url)

  const notification = new PushNotification(isGerman() ? 'Green_Lab Client hat einen Server für dich erstellt' : 'We have created a server for you', {
    body: isGerman() ? 'Die IP wurde in deine Zwischenablage kopiert' : 'The IP has been copied to your clipboard'
  })

  console.log(`[OWT] Connected to ${url}`)
  notification.send()
}

module.exports = { openToWorld }
