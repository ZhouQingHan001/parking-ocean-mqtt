const topicEmitter = require('./mqtt/mqttSubscribe').topicEmitter;
const publish = require('./mqtt/mqttPublish').publish;
const protocol = require('./utils/protocol');
const protocol_old = require('./utils/protocol_old');

console.log(`
__   __  _______  __   __  _______    _______  ______    _______  _______  ______  
|  |_|  ||       ||  | |  ||       |  |  _    ||    _ |  |       ||   _   ||      | 
|       ||   _   ||  |_|  ||    ___|  | |_|   ||   | ||  |   _   ||  |_|  ||  _    |
|       ||  | |  ||       ||   |___   |       ||   |_||_ |  | |  ||       || | |   |
|       ||  |_|  ||       ||    ___|  |  _   | |    __  ||  |_|  ||       || |_|   |
| ||_|| ||       | |     | |   |___   | |_|   ||   |  | ||       ||   _   ||       |
|_|   |_||_______|  |___|  |_______|  |_______||___|  |_||_______||__| |__||______| 

                Start Time: ${new Date().toLocaleString()}
                Process Enviroment: ${process.env.NODE_ENV}
`);

const onStandard = async (_, packet) => {
  const { cmd, retain, qos, dup, length, topic, payload } = packet;
  // console.log(JSON.stringify(await protocol(payload)));
  publish(await protocol(payload));
};

const onOldJson = async (_, packet) => {
  const { payload } = packet;
  // console.log(JSON.stringify(await protocol_old(payload)));
  publish(await protocol_old(payload));
};

/**
 * mqtt主题监听 类似于mqtt的主题分割 但是略有区别
 * 1. mqtt中的 + 其功能与 * 类似 如想监听 a/+/c 中的内容 在此使用 * 代替 +
 * 2. mqtt中的 # 其功能与 ** 类似 如想监听 a/b/# 中的内容 在此使用 ** 代替 #
 */

topicEmitter.on('mvb/51/1/standard', onStandard);
topicEmitter.on('mvb/51/1/status', onOldJson);
topicEmitter.on('mvb/51/1/info', onOldJson);
