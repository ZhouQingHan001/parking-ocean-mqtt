const userinfo = require('./userInfo');

const isJsonString = str => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const deserialize = async payload => {
  const receiveJsonString = payload.toString().slice(8);
  const receiveHeader = payload.toString().slice(0, 4);
  if (receiveHeader === 'TCLD' && isJsonString(receiveJsonString)) {
    const packetBody = JSON.parse(receiveJsonString);
    if (!('Name' in packetBody)) {
      const NameArray = ['TMoteStatus', 'TMoteInfo', 'RadarDbg', 'WorkInfo', 'ResponseInfo'];
      NameArray.map(item => {
        if (item in packetBody) {
          packetBody.Name = item;
        }
      });
    }
    const { SN, TMoteInfo } = packetBody;
    if (TMoteInfo) TMoteInfo.PlatformType = 'MQTT';
    packetBody.OwnerInfo = (await userinfo.getOwnerInfo(SN)) || {};
    return { ...packetBody };
  }
};

module.exports = deserialize;
