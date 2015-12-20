// Change this to your publisher number
// usage:
// var PUBLISHER_ID = require('./indeed-config.js')
// var Indeed = require('./indeed-callback.js')
// var indeed_client = new Indeed(PUBLISHER_ID);
var PUBLISHER_ID = require('./indeed-config.js');
var Indeed = require('./indeed-callback.js');
var indeed_client = new Indeed(PUBLISHER_ID);

indeed_client.search({
    q: 'javascript',
    l: 'austin',
    userip: '1.2.3.4',
    useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2)'
}, function(search_response){
    console.log(search_response);
});
