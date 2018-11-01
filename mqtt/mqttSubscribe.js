const mqtt = require('mqtt');
const log4js = require('log4js');
const EventEmitter2 = require('eventemitter2').EventEmitter2;

// 日志
const log4mqtt = log4js.getLogger('mqtt');
log4mqtt.level = 'debug';

// 链接mqtt
const brokerUrl = 'mqtt://xxx.xxx.xxx.xxx:1883';
const clientId = `PARKING_OCEAN_MQTT_SUB_1`;
// 事件
const topicEmitter = new EventEmitter2({
  wildcard: true,
  delimiter: '/',
});

const TOPIC = ['/', '/', '/'];
const client = mqtt
  .connect(
    brokerUrl,
    { clientId, clean: true }
  )
  .on('connect', connack => {
    log4mqtt.info(` connect success, ${JSON.stringify(connack)}`);
  })
  .on('reconnect', () => {
    log4mqtt.warn('reconnect start');
  })
  .on('error', err => {
    log4mqtt.error(`error occured, ${err}`);
    client.reconnect();
  })
  .on('close', () => {
    log4mqtt.error('client closed');
  })
  .on('offline', () => {
    log4mqtt.error('client offline');
  })
  .subscribe(TOPIC, (error, granted) => {
    if (error) {
      log4mqtt.error(`subscribe error ${error}`);
    } else {
      log4mqtt.info(`subscribe success ${JSON.stringify(granted)}`);
    }
  })
  .on('message', async (topic, payload, packet) => {
    log4mqtt.info(` --> ${topic}`);
    topicEmitter.emit(topic, payload, packet);
  });

exports.topicEmitter = topicEmitter;
