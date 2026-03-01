const appJson = require('./app.json');

// reads mapbox tokens
module.exports = {
  expo: {
    ...appJson.expo,
  },
};
