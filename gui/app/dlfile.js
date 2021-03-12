const request = require('request')
const fs = require('fs')

function downloadFile (fileUrl, targetPath, onEnd, onProgress) {
  // Save variable to know progress
  var receivedBytes = 0
  var totalBytes = 0

  var req = request({
    method: 'GET',
    uri: fileUrl
  })

  var out = fs.createWriteStream(targetPath)
  req.pipe(out)

  req.on('response', function (data) {
    // Change the total bytes value to get progress later.
    totalBytes = parseInt(data.headers['content-length'])
  })

  req.on('data', function (chunk) {
    // Update the received bytes
    receivedBytes += chunk.length

    onProgress(showProgress(receivedBytes, totalBytes))
  })

  req.on('end', onEnd)
}

function showProgress (received, total) {
  const percentage = (received * 100) / total
  return `${Math.floor(percentage)}% | ${Math.round(received / 1024 / 1024)}mb / ${Math.round(total / 1024 / 1024)}mb`
}

module.exports = downloadFile
