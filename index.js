const https = require('https');
const Table = require('cli-table3');
const groupBy = require('json-groupby');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  { name: 'summary', type: Boolean, defaultOption: false },
  { name: 'country_code', type: String }
];
const options = commandLineArgs(optionDefinitions);

const request = {
  hostname: 'coronavirus-tracker-api.herokuapp.com',
  port: 443,
  path: (options.country_code) ? '/v2/locations?country_code=' + options.country_code : '/v2/locations',
  method: 'GET'
};

//let table = new Table({ chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''} });
let table = new Table({
  chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
         , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
         , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
         , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
});

const req = https.request(request, res => {
  console.log(`COVID API statusCode: ${res.statusCode}`);

  let response = "";

  res.on('data', d => {
    response += d;

  });

  res.on("end", () => {
    try {
        let json = JSON.parse(response);
        let data = groupBy(json.locations, ['country_code', 'country', 'province'], ['latest.confirmed', 'latest.deaths', 'latest.recovered']);

        if (options.summary) {
          table.push(
            ["Country Code", "Country", "Confirmed", "Recovered", "Death"],
            ["","","","",""]
          );  
        } else {
          table.push(
            ["Country Code", "Country", "Province", "Confirmed", "Recovered", "Death"],
            ["","","","","",""]
          );
        }
        for(let country_code in data) {
          for (let country in data[country_code]) {
            if (options.summary) {
              let confirmed = 0;
              let recovered = 0;
              let death = 0;
              for (let province in data[country_code][country]) {
                confirmed += data[country_code][country][province]["latest.confirmed"][0];
                recovered += data[country_code][country][province]["latest.recovered"][0];
                death += data[country_code][country][province]["latest.deaths"][0];
              }
              table.push(
                [country_code, country, confirmed, recovered, death]
              );
            } else {
              for (let province in data[country_code][country]) {
                let confirmed = data[country_code][country][province]["latest.confirmed"][0];
                let recovered = data[country_code][country][province]["latest.recovered"][0];
                let death = data[country_code][country][province]["latest.deaths"][0];
                table.push(
                  [country_code, country, province, confirmed, recovered, death]
                );
              }
            }
          }  
        }
        console.log(table.toString());
    } catch (error) {
        console.error(error.message);
    }
  });

});

req.on('error', error => {
  console.error(error)
});

req.end();
