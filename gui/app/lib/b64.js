function btoa (str) {
  if (Buffer.byteLength(str) !== str.length) throw new Error('bad string!')
  return Buffer.from(str, 'binary').toString('base64')
}

const atob = require('atob')

module.exports = { btoa, atob }
