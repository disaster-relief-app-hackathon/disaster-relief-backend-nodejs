'use strict';

var request = require('request');

// Imports the Google Cloud client library
const language = require('@google-cloud/language');

// Instantiates a client
const client = new language.LanguageServiceClient({
    keyFilename: 'chatbot-64ab86bc6794.json'
});

var accuweather = {
  baseUrl: 'http://dataservice.accuweather.com',
  key: 'HackPSU2018',
};

module.exports = function(User) {
  User.getLocationKey = function(lat, lng, cb) {
    request({
      method: 'GET',
      url: 'http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=HackPSU2018&q=' + lat + '%2C' + lng,
    }, function(err, res, body) {
      body = JSON.parse(body);
      cb(null, {
        locationKey: body.Key,
      });
    });
  };

  User.remoteMethod(
        'getLocationKey', {
          accepts: [{
            arg: 'lat',
            type: 'number',
            required: true,
          },
          {
            arg: 'lng',
            type: 'number',
            required: true,
          }],
          returns: {
            arg: 'data',
            type: 'object',
            root: true,
          },
          http: {
            path: '/getLocationKey',
            verb: 'get',
          },
        }
      );

  User.chatMessage = function(locationKey, message, cb) {
      // The text to analyze;
      const document = {
        content: message,
        type: 'PLAIN_TEXT',
        };
    client
        .analyzeEntities({document: document})
        .then(results => {
            const entities = results[0].entities;
            entities.forEach(entity => {
                if(entity.name) {
                    console.log(entity.name);
                    switch (entity.name) {
                        case 'weather':

                            if (['today'].some(function(v) { return message.indexOf(v) >= 0; })) {
                                request({
                                    method: 'GET',
                                    url: accuweather.baseUrl + '/currentconditions/v1/' + locationKey + '?apikey=' + accuweather.key,
                                  }, function(err, res, body) {
                                      body = JSON.parse(body);
                                    cb(null, {
                                        responseMessage: 'Weather is ' + body[0].WeatherText + ' with a temperature of ' + body[0].Temperature.Metric.Value + '°' + body[0].Temperature.Metric.Unit 
                                    });
                                  });
                            }
                            else if (['now'].some(function(v) { return message.indexOf(v) >= 0; })) {
                                request({
                                    method: 'GET',
                                    url: accuweather.baseUrl + '/currentconditions/v1/' + locationKey + '?apikey=' + accuweather.key,
                                  }, function(err, res, body) {
                                      body = JSON.parse(body);
                                    cb(null, {
                                        responseMessage: 'Weather is ' + body[0].WeatherText + ' with a temperature of ' + body[0].Temperature.Metric.Value + '°' + body[0].Temperature.Metric.Unit 
                                    });
                                  });
                            }
                            else if (['tomorrow'].some(function(v) { return message.indexOf(v) >= 0; })) {
                                request({
                                    method: 'GET',
                                    url: accuweather.baseUrl + '/currentconditions/v1/' + locationKey + '?apikey=' + accuweather.key,
                                  }, function(err, res, body) {
                                      body = JSON.parse(body);
                                    cb(null, {
                                        responseMessage: 'Weather is ' + body[0].WeatherText + ' with a temperature of ' + body[0].Temperature.Metric.Value + '°' + body[0].Temperature.Metric.Unit 
                                    });
                                  });
                            }
                            // It returns the weather alarm for the next one week, but currently shows the first alarm
                            // else if (['week'].some(function(v) { return message.indexOf(v) >= 0; })) {
                              else {
                              request({
                                    method: 'GET',
                                    url: accuweather.baseUrl + '/alarms/v1/10day/' + locationKey + '?apikey=' + accuweather.key,
                                  }, function(err, res, body) {
                                      body = JSON.parse(body);
                                    cb(null, {
                                        responseMessage: body[0].Alarms[0].AlarmType + ' on ' + new Date(body[0].Date).toDateString() 
                                    });
                                  });
                            }
                            break;
                    
                        default:
                          cb(null, {
                            responseMessage: 'We will get back to you'
                          });
                            break;
                    }
                }
            });
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
  };

  User.remoteMethod(
            'chatMessage', {
              accepts: [{
                arg: 'locationKey',
                type: 'number',
                required: true,
              },
              {
                arg: 'message',
                type: 'string',
                required: true,
              }],
              returns: {
                arg: 'data',
                type: 'object',
                root: true,
              },
              http: {
                path: '/chatMessage',
                verb: 'get',
              },
            }
          );
};

// 10days weather 
// Alerts https://developer.accuweather.com/accuweather-alerts-api/apis/get/alerts/v1/%7BlocationKey%7D
// Current Condition https://developer.accuweather.com/accuweather-current-conditions-api/apis/get/currentconditions/v1/%7BlocationKey%7D
// daily forecast https://developer.accuweather.com/accuweather-forecast-api/apis/get/forecasts/v1/daily/1day/%7BlocationKey%7D