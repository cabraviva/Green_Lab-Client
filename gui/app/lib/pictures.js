const pictures = require('../pictures/pictures.json')

for (var i = 0; i < pictures.length; i++) {
  pictures[i] = './pictures/' + pictures[i]
}

module.exports = pictures
