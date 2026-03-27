require('dotenv').config();
require('@telazer/json-bigint').override();

if (process.env.PLATFORM === 'dev') {
  require('ts-node').register();
  require('./src/electron/electron.ts');
} else {
  require('./build/electron/electron.js');
}
