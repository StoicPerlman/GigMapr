// usage:
// var PUBLISHER_ID = require('./indeed-config.js')
// var Indeed = require('./indeed-callback.js')
// var indeed_client = new Indeed(PUBLISHER_ID);

// If ENV variable set use t=it else 
// Change this to your publisher number
module.exports = process.env.INDEED_PUB 
					? process.env.INDEED_PUB 
					: 'FILL_ME_IN';
