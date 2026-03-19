const { expo } = require('./app.json');

const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || './google-services.json';

module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      googleServicesFile,
    },
  },
};
