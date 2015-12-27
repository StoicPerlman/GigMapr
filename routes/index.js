var express = require('express');
var router = express.Router();
var promise = require('promise');
var cities = require('cities');
var tm = require('textmining');

var PUBLISHER_ID = require('../indeed-node/indeed-config.js');
var Indeed = require('../indeed-node/indeed-promise.js');

var states = {
    'AK': 'Alaska',
    'AL': 'Alabama',
    'AR': 'Arkansas',
    'AZ': 'Arizona',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DC': 'District of Columbia',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'IA': 'Iowa',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'MA': 'Massachusetts',
    'MD': 'Maryland',
    'ME': 'Maine',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MO': 'Missouri',
    'MS': 'Mississippi',
    'MT': 'Montana',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'NE': 'Nebraska',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NV': 'Nevada',
    'NY': 'New York',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VA': 'Virginia',
    'VT': 'Vermont',
    'WA': 'Washington',
    'WI': 'Wisconsin',
    'WV': 'West Virginia',
    'WY': 'Wyoming'
};


//!* GET home page. *!/
router.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');

});

router.get('/about', function(req, res) {
    res.sendFile(__dirname + '/public/about.html');
});

router.get('/US/:query/', function(req, res) {
    getEachStateCount(req.params.query).then(function (resp) {
            res.json(resp);
        }
    );
});

router.get('/:state('+ Object.keys(states).join('|') + ')/:query/', function(req,res){
    getListings(req.params.query, req.params.state).then(function (resp) {
        var allCityCounts = [];
        resp = cleanListings(resp)
        var listings = resp['listings']
        var bagOfWords = getWordCounts(resp['fullText']);

        var cityCounts = getCityCounts(listings);
        //var comps = getCompanyCount(listings);   the two will be implemented later
        //comps = getTopTenCompanies(comps);

        // for each city in results lookup coordinates of city
        for (var cityName in cityCounts) {
            var cityData = cityLookup(cityName, req.params.state);
            allCityCounts.push(getLatLongMeans(cityData, cityCounts[cityName], cityName));
        }
        res.json({cityCounts: allCityCounts, bagOfWords: bagOfWords});
    })
});

module.exports = router;


///////////////Start Main///////////////
function getEachStateCount(query) {
    var promises = [];
    for (var state in states) {
        promises.push(getStateCount(query, states[state]))
    }
    return promise.all(promises).then(function(resp) {
        var results = {};
        for (var i in resp) {
            var abbr = getKeyByValue(states, resp[i]['location'])
            results[abbr] = resp[i]['totalResults'];
        }
        return results;
    });

}

function getListings(query, location) {
    return getStateCount(query, location).then(function(resp) {
        var count = resp['totalResults'];
        var totalPages = Math.floor(count/25);
        var currentPage = 0;
        var MAX_API_CALLS = 500;
        var promises = [];
        // TODO: Get a real promise pool manager working
        // this is a super hack for one
        // this makes 500 parallel calls then waits to finish
        // then makes 500 more
        // I would walk 500 miles…
        // need good pool manager with concurrency limit
        // this limits to 25,000 jobs
        while (currentPage <= totalPages && currentPage < MAX_API_CALLS) {
            promises.push(search(query, location, 25, 25 * currentPage))
            currentPage++;

        }
        return promise.all(promises).then(function (resp1) {
            if (currentPage <= totalPages && currentPage < MAX_API_CALLS * 2) {
                var promises = [];
                while (currentPage <= totalPages && currentPage < MAX_API_CALLS * 2) {
                    promises.push(search(query, location, 25, 25 * currentPage));
                    currentPage++;
                }
                return promise.all(promises).then(function (resp2) {
                    return resp1.concat(resp2);
                });
            }
            else {
                return resp1;
            }
        });
        return resp;
    });
};
///////////////End Main///////////////



///////Start Indeed-Node-Wrapper////////
function search(query, location, limit, start) {
    limit = limit ? limit : 10;
    start = start ? start : 0;
    var indeed_client = new Indeed(PUBLISHER_ID);
    var params = {
        'q': query,
        'l': location,
        'limit': limit,
        'start': start,
        'userip': "1.2.3.4",
        'dupefilter':false,
        'useragent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2)"
    };
    return indeed_client.search(params);
}

function getStateCount(query, state) {
    return search(query, state, 0, 0)
}
///////End Indeed-Node-Wrapper////////



////////////Start Helpers////////////
function cleanListings(listings) {
    var jobs = [];
    var fullText = '';
    for (var listing in listings) {
        for (var ress in listings[listing]['results']) {
            // clean title and snippet
            var ress = listings[listing]['results'][ress];
            ress["snippet"] = removeTags(ress["snippet"])
            fullText += removeSpecial(ress["snippet"]) + ' '
            fullText += removeSpecial(ress["jobtitle"]) + ' '

            // remove unwanted data
            delete ress['jobkey'];
            delete ress['onmousedown'];
            delete ress['source'];
            delete ress['indeedApply'];
            delete ress['formattedRelativeTime'];
            delete ress['formattedLocation'];
            delete ress['formattedLocationFull'];
            delete ress['sponsored'];
            delete ress['url'];
            delete ress['noUniqueUrl'];
            delete ress['expired'];
            delete ress['country'];
            delete ress['snippet'];
            delete ress['jobtitle'];
            jobs.push(ress);
        }
    }
    return {'listings':jobs, 'fullText':fullText};
}

function removeSpecial(text) {
    // only preserve ISO/IEC recognized languages
    var regex = new RegExp('\s*' + escapeRegExp('c#') + '\s*', 'gi');
    text = text.replace(regex, ' cz ');
    regex = new RegExp('\s*' + escapeRegExp('c++') + '\s*', 'gi');
    text = text.replace(regex, ' czz ');
    regex = new RegExp('\s*' + escapeRegExp('.net') + '\s*', 'gi');
    text = text.replace(regex, ' znet ');

    // remove non alpha  or non space and lower
    text = text.replace(/[^a-zA-Z ]/g, ' ')
    text = text.toLowerCase();

    // put languages back
    text = text.replace(new RegExp('czz', 'g'), ' C++ ');
    text = text.replace(new RegExp('cz', 'g'), ' C# ');
    text = text.replace(new RegExp('znet', 'g'), ' .NET ');

    // remove one letter words except c cuz its a language
    var regex = new RegExp(' [a-bd-z] ', 'gi');
    text = text.replace(regex, ' ');

    text = fillAbbr(text);
    // remove double, triple, etc spaces and spaces at end
    text = text.replace(/ +(?= )/g,'');
    text = text.trim();

    return text
}

function fillAbbr(text) {
    // sub some common abbreviations
    var regex = new RegExp('\s*jr\s*', 'gi');
    text = text.replace(regex, ' junior ');
    regex = new RegExp('\s*sr\s*', 'gi');
    text = text.replace(regex, ' senior ');
    regex = new RegExp('\s*vb\s*', 'gi');
    text = text.replace(regex, ' visual basic ');
    return text;
}

function removeTags(text) {
    // remove HTML tags
    var regex = /(<([^>]+)>)/ig;
    return text.replace(regex, '');
}

function getWordCounts(text) {
    text = tm.getTermsFrequency(tm.removeStopWords(text));
    text.sort(function(a, b) {
        return b.frequency - a.frequency;
    })

    var bag = [];
    for (var i in text){
        bag[i] = {};
        bag[i]['text'] = text[i]['term'];
        // text size min 20 max 50 default square root of freq + 10
        bag[i]['size'] = Math.max(Math.min(Math.sqrt(text[i]['frequency']) + 10, 50), 20);
        if (i >= 100) {
            break;
        }
    }
    return bag;
}

// multiple coordinates exists for one city
// get the mean to find approximate center of city
function getLatLongMeans(cityData, radius, cityName) {
    // get the total
    var lat = 0;
    var long = 0;
    var c = 0;
    for (var j in cityData) {
        lat += Number(cityData[j]['latitude']);
        long += Number(cityData[j]['longitude']);
        c++;
    }
    //get the mean of lat long
    // square root count to normilize radiuses and add city name
    return {'latitude': lat / c, 'longitude': long / c, 'radius': Math.sqrt(radius), 'city': cityName};
}

function cityLookup(cityName, state) {
    var allCities = cities.findByState(state.toUpperCase())
    var cityMatch = [];
    // push all coordinates of current city to array
    for (var j in allCities) {
        if (allCities[j]['city'].toLowerCase() === cityName.toLowerCase()) {
            cityMatch.push(allCities[j]);
        }
    }
    return cityMatch;
}

function getCompanyCount(listings) {
    var comps = {}
    for (var i in listings) {
        if (comps[listings[i]['company']]) {
            comps[listings[i]['company']]++;
        }
        else {
            comps[listings[i]['company']] = 1;
        }
    }
    delete comps[''];
    return comps;
}

// gets occurrences of each company and city
// reduces [{city:bradford,company:zippo}, {city:bradford,company:wallmart}.....]
// to {bradford:2} {zippo:1,walmart:1}
function getCityCounts(listings) {
    var city = {};
    for (var i in listings) {
        if (city[listings[i]['city']]) {
            city[listings[i]['city']]++;
        }
        else {
            city[listings[i]['city']] = 1;
        }
    }
    delete city[''];
    return city;
}

function getTopTenCompanies(comps) {
    // sorts comps by value and returns sorted keys
    var keysSorted = Object.keys(comps).sort(function(a,b){return comps[b]-comps[a]})
    var newComps = {};
    // use sorted keys to get top 10 employers
    for (var i = 0; i < 10; i++) {
        newComps[keysSorted[i]] = comps[keysSorted[i]]
    }
    return newComps;
}

function getKeyByValue(obj, value ) {
    for( var prop in obj ) {
        if( obj.hasOwnProperty( prop ) ) {
            if( obj[ prop ] === value )
                return prop;
        }
    }
}

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
/////////////End Helpers/////////////
