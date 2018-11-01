const mongoose = require('mongoose');
const log4js = require('log4js');
log4mongo = log4js.getLogger('mongo');

mongoose.set('useCreateIndex', true);
log4mongo.level = 'debug';

const url = 'mongodb://:27017,:27017/parking_platform';
const Options = {
  replicaSet: 'XXXXXXXX-01',
  user: 'XXXXXXXX',
  pass: 'XXXXXXXX',
  useNewUrlParser: true,
};
mongoose.connect(
  url,
  Options
);

const db = mongoose.connection;

db.on('open', () => {
  log4mongo.info(` Database db Connection using Mongoose succeed!`);
});

db.on('error', error => {
  log4mongo.error(`Error in MongoDB db connection ${error}`);
});

exports.db = db;
