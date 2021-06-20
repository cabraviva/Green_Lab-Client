// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const dcClientID = '777488569345769482'
const client = require('discord-rich-presence')(dcClientID)
const ngrok = require('ngrok')

// Socketio
const ioserver = require('./io-server.js')
ioserver.onSocket(socket => {
  socket.on('DLOG', console.log)

  // NGROK
  socket.on('killNgrok', () => {
    ngrok.kill()
  })

  socket.on('spawnNgrok', (port, resolve) => {
    ngrok.connect(port).then(resolve).catch(resolve)
  })

  // MSMC
  socket.on('msmc', (prompt = 'select_account', success) => {
    require("msmc").getElectron().FastLaunch(
      (call) => {
        // The function is called when the login has been successful
        console.log("Login successful");
        var accessToken = call.access_token
        var profile = call.profile

        success(accessToken, profile)
      },
      (update) => {
        // A hook for catching loading bar events and errors
        // Possible types are: Starting, Loading, Rejection, Error
        switch (update.type) {
          case "Starting":
            console.log("Checking user started!");
            break;
          case "Loading":
            console.log("Loading:", update.data, "-", update.percent + "%");
            break;
          case "Rejection":
            console.error("Fetch rejected!", update.data);
            break;
          case "Error":
            console.error("MC-Account error:", update.data);
            break;
          case "Canceled":
            console.error("User clicked cancel!")
            break;
        }
      },
      prompt
    )
  })
})

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 920,
    minWidth: 920,
    height: 680,
    minHeight: 680,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      webviewTag: true
    },
    frame: false,
    titleBarStyle: 'hidden',
    icon: `${__dirname}/app/icon.png`
  })

  // and load the index.html of the app.
  mainWindow.loadFile(`${__dirname}/app/index.html`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

global.activity = {
  state: 'In Launcher',
  details: 'Idle',
  startTimestamp: new Date()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  ngrok.kill()
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function setActivity () {
  client.updatePresence({
    state: global.activity.state,
    details: global.activity.details,
    startTimestamp: global.activity.startTimestamp,
    largeImageKey: global.activity.largeImageKey || 'icon',
    smallImageKey: global.activity.smallImageKey
  })
}

client.on('error', console.error)

setActivity()

setInterval(() => {
  setActivity()
}, 1000)
