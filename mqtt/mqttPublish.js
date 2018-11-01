const mqtt = require('mqtt');
const log4js = require('log4js');

// 日志
const log4mqtt = log4js.getLogger('mqtt');
log4mqtt.level = 'debug';

// 链接mqtt
const brokerUrl = 'mqtt://xxx.xxx.xxx.xxx:1883';
const clientId = `PARKING_OCEAN_MQTT_PUSH_1`;

const client = mqtt
  .connect(
    brokerUrl,
    { clientId, clean: true }
  )
  .on('connect', connack => {
    log4mqtt.info(`connect success, ${JSON.stringify(connack)}`);
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
  });

const cb4publish = (error, packet) => {
  if (error) {
    log4mqtt.error(` :: publish error, errmsg: ${error}`);
  } else {
    log4mqtt.info(` :: publish success, packet: ${JSON.stringify(packet)}`);
  }
};

const publish = message => {
  const { SN, OwnerInfo: ownerinfo, Name: name } = message;
  const topic = [];
  // 一级 数据类型
  // topic.push(name);
  // // 二级 预留
  // topic.push('');
  // // 三级 预留
  // topic.push('');
  // // 四级 预留
  // topic.push('');
  // 五级和用户链
  // 由于历史包袱的原因 拿到的MqttTopic开头就有一个反斜杠 这个反斜杠会造成四五级中间多了一个斜杠 故目前临时手动去掉
  topic.push(
    ownerinfo instanceof Array
      ? ownerinfo[ownerinfo.length - 1].MqttTopic.slice(1)
      : 'unknwon/unknown/'
  );

  if (process.env.NODE_ENV === 'production') {
    log4mqtt.info(` :: publish begin, topic: ${'/' + topic.join('/')} SN: ${SN}`);
    client.publish('/' + topic.join('/'), `TCLD110P${JSON.stringify(message)}`, cb4publish);
  } else {
    log4mqtt.info(` :: publish begin, topic: ${'dev/' + topic.join('/')} SN: ${SN}`);
    client.publish('dev/' + topic.join('/'), `TCLD110P${JSON.stringify(message)}`, cb4publish);
  }
};

exports.publish = publish;