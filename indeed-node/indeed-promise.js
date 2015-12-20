var promise = require('request-promise');

module.exports = Indeed = function(publisher){

    this.publisher = publisher;

    this.httpOptions = {'uri':'http://api.indeed.com/ads/apisearch', 'qs':''};

    this.defaults = {'v': '2', 'format': 'json', 'publisher': this.publisher};

    this.serialize_params = function(params) {
        var str = [];
        for(var p in params)
            if (params.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
            }
        return '?' + str.join("&");
    }

    this.search = function(params){
        this.validate_params(params);

        for(var attr in this.defaults){params[attr] = this.defaults[attr];}

        this.httpOptions['qs'] = params;

        return promise(this.httpOptions).then(function(resp) { return JSON.parse(resp); });
    };

    this.required_fields = ['userip', 'useragent', ['q', 'l']];

    this.validate_params = function(params){
        var num_required = this.required_fields.length;

        for(var i = 0; i < num_required; i++){
            var field = this.required_fields[i];
            if(field instanceof Array){
                var num_one_required = field.length;
                var has_one = false;
                for(var x = 0; x < num_one_required; x++){
                    if(field[x] in params){
                        has_one = true;
                        break;
                    }
                }
                if(!has_one){
                    throw "You must provide one of the following " + field.join();
                }
            }else if(!(field in params)){
                throw "The field "+field+" is required";
            }
        }
    };

};