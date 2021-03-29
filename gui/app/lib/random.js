var random={choose:function(arr){return arr[this.int(0,arr.length)]},int:function(min,max){return Math.floor(Math.random()*(max-min)+min)},bit:function(){return Math.round(Math.random())},cryptobit:function(){var c=parseInt(crypto.getRandomValues(new Uint32Array(1))[0].toString()[0]);if(c>=5){return 1}else{return 0}}};
module.exports = random
