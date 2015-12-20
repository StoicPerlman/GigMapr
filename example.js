var Indeed = require('./indeed-callback.js')
var indeed_client = new Indeed('FILL_ME_IN');

indeed_client.search({
    q: 'javascript',
    l: 'austin',
    userip: '1.2.3.4',
    useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2)',
}, function(search_response){
    console.log(search_response);
});
