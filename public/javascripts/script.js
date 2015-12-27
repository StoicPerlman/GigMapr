$( document ).ready( function() {
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
        'WY': 'Wyoming'};

    popDrpList(document.getElementById('statesDrp'), states);
    var stateCenters = {};
    LoadUS();

    ///////////////Main///////////////
    function LoadUS() {
        var USmap = new Datamap({
            element: document.getElementById("map"),
            scope: 'usa', //currently supports 'usa' and 'world', however with custom map data you can specify your own
            projection: 'equirectangular', //style of projection to be used. try "mercator"
            height: 520, //if not null, datamaps will grab the height of 'element'
            fills: {
                defaultFill: '#EDDC4E'
            },
            geographyConfig: {
                highlightBorderColor: '#bada55',
                popupTemplate: function (geography, data) {
                    return '<div class="hoverinfo">' + geography.properties.name + '</div>'
                },
                highlightBorderWidth: 2
            }
        });
        USmap.labels();
    }

    function FillUS(data) {
        document.getElementById("map").innerHTML = '';
        var USmap = new Datamap({
            element: document.getElementById("map"),
            scope: 'usa', //currently supports 'usa' and 'world', however with custom map data you can specify your own
            projection: 'equirectangular', //style of projection to be used. try "mercator"
            height: 520, //if not null, datamaps will grab the height of 'element'
            fills: {
                defaultFill: '#EDDC4E'
            },
            geographyConfig: {
                highlightBorderColor: '#bada55',
                popupTemplate: function (geography, data) {
                    return '<div class="hoverinfo">' + geography.properties.name + '</div>';
                },
                highlightBorderWidth: 2
            }
        });
        USmap.labels({'customLabelText': data});
        USmap.updateChoropleth(generateColorPallet(data, ['yellow', 'red']));
    }

    function FillState(data) {
        document.getElementById("map").innerHTML = '';
        var Statemap = new Datamap({
            element: document.getElementById("map"),
            scope: 'usa', //currently supports 'usa' and 'world', however with custom map data you can specify your own
            projection:'',
            height: 520,
            setProjection: function(element) {
                var projection = d3.geo.equirectangular()
                    .center(stateCenters[$('#statesDrp').val().toLowerCase()]['centroid'])
                    .rotate([0.0, 0])
                    .scale(stateCenters[$('#statesDrp').val().toLowerCase()]['scale'])
                    .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
                var path = d3.geo.path()
                    .projection(projection);

                return {path: path, projection: projection};
            },
            fills: {
                defaultFill: '#EDDC4E'
            },
            geographyConfig: {
                highlightBorderColor: '#bada55',
                popupTemplate: function (geography, data) {
                    return '<div class="hoverinfo">' + geography.properties.name + '</div>'
                },
                highlightBorderWidth: 2
            }
        });
        Statemap.bubbles(data, {
            popupTemplate: function (geo, data) {
                return '<div class="hoverinfo">' +  data.city + '</div>';
            }
        });
    }

    function FillCloud(termFreq) {
        document.getElementById("cloud").innerHTML = '';
        var fill = d3.scale.category20();
        d3.layout.cloud().size([960, 600])
            .words(termFreq)
            .padding(1)
            .rotate(function() { return ~~(Math.random() * 2) * 90; })
            .font("Impact")
            .fontSize(function(d) { return d.size; })
            .on("end", draw)
            .start();
        function draw(words) {
            d3.select("#cloud").append("svg")
                .attr("width", 960)
                .attr("height", 600)
                .append("g")
                .attr("transform", "translate(480,300)")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function(d) { return d.size + "px"; })
                .style("font-family", "Impact")
                .style("fill", function(d, i) { return fill(i); })
                .attr("text-anchor", "middle")
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function(d) { return d.text; });
        }
    }
    ///////////////Main///////////////

    ///////////////AJAX///////////////
    function getUSStats() {
        $.ajax({
            'url': '/US/' + encodeURIComponent($('#search').val()),
            'dataType':'json',
            'success': function (data) {
                FillUS(data);
            }
        });
    }

    function getStateStats() {
        $.ajax({
            'url': '/' + $('#statesDrp').val() + '/' + encodeURIComponent($('#search').val()),
            'dataType':'json',
            'success': function (data) {
                FillState(data['cityCounts']);
                FillCloud(data['bagOfWords']);
            }
        });
    };

    $.getJSON( "javascripts/us-states.json", function( data ) {
        stateCenters = data;
    });
    ///////////////AJAX///////////////

    ///////////////Events///////////////
    $('#statesDrp').on('change', function () {
        if ($('#search').val() != '') {
            if ($('#statesDrp').val() == 'US') {
                getUSStats();
            }
            else {
                var check = function(){
                    if(stateCenters){
                        getStateStats()
                    }
                    else {
                        setTimeout(check, 500);  // check again in half second needs to be loaded before fill state
                    }
                };
                check();
            }
        }
    });

    $('#goButton').click(function () {
        if ($('#search').val() != '') {
            if ($('#statesDrp').val() == 'US') {
                getUSStats();
            }
            else {
                var check = function() {
                    if(stateCenters){
                        getStateStats()
                    }
                    else {
                        setTimeout(check, 500); // check again in half second needs to be loaded before fill state
                    }
                };
                check();
            }
        }
    });
    ///////////////Events///////////////

    ///////////////Helpers///////////////
    function popDrpList(drp, list) {
        drp.options[0] = new Option('United States', 'US');
        for (var i in list) {
            drp.options[drp.options.length] = new Option(list[i], i);
        }
    }

    // state data {"PA": 234,...}
    // array of color names for pallet
    // color for low values to color for high values
    function generateColorPallet(data, colors) {
        var keysSorted = Object.keys(data).sort(function(a,b){return data[a]-data[b]});

        var color = d3.scale.linear()
            .domain([0, keysSorted.length])
            .range(colors);
        var colorPallet = {};

        for (var i = 0; i < keysSorted.length; i++) {
            colorPallet[keysSorted[i]] = color(i);
        }
        return colorPallet;
    }
});