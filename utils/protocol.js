require('buffer').Buffer;
const userinfo = require('./userInfo');
const moment = require('moment');

/**
 *
 * @param {Buffer} buffer 8 bytes
 *
 * packetType 5: 主动消息上报 7: 透传
 */
const deserializePacketHead = buffer => {
  if (!(buffer instanceof Buffer)) {
    throw new Error('buffer should be a Buffer');
  }

  const dataLen = buffer.readUInt8(0);

  const byte1 = buffer.readUInt8(1);
  const protocolType = byte1 & 0b00000111;
  const reserved1 = (byte1 >> 3) & 0b11;
  const protocolVersion = (byte1 >> 5) & 0b111;

  const byte2 = buffer.readUInt8(2);
  const reserved2 = byte2 & 0b1111;
  const packetType = (byte2 >> 4) & 0b1111;
  const packetNo = buffer.readUInt8(3);
  const deviceSn = buffer.readUInt32LE(4).toString(16);

  let packetTypeReadable = 'Unknown';
  switch (packetType) {
    case 5: {
      packetTypeReadable = 'Report';
      break;
    }
    case 7: {
      packetTypeReadable = 'Transparent';
      break;
    }
    default: {
      packetTypeReadable = 'Unknown';
      break;
    }
  }

  return {
    DataLen: dataLen,
    ProtocolType: protocolType,
    Reserved1: reserved1,
    ProtocolVersion: protocolVersion,
    Reserved2: reserved2,
    PacketType: packetTypeReadable,
    PacketNumber: packetNo,
    SN: deviceSn,
  };
};

/**
 *
 * @param {Buffer} buffer 6 bytes
 */
const deserializePacketMsg = buffer => {
  if (!(buffer instanceof Buffer)) {
    throw new Error('buffer should be a Buffer');
  }

  const destSn = buffer.readUInt32LE(0).toString(16);
  const version = buffer.readUInt8(4);
  const type = buffer.readUInt8(5);

  let typeReadable = 'Unknown';
  switch (type) {
    case 0x3a: {
      typeReadable = 'TMoteStatus';
      break;
    }
    case 0x35:
    case 0x3c:
    case 0x3d: {
      typeReadable = 'TMoteInfo';
      break;
    }
    case 0x3f: {
      typeReadable = 'TMoteHexStr';
      break;
    }
    default: {
      typeReadable = 'Unknown';
      break;
    }
  }

  return { DestSN: destSn, Version: version, Type: typeReadable };
};

/**
 *
 * @param {Buffer} buffer 7 bytes
 */
const deserializePacketShort = buffer => {
  if (!(buffer instanceof Buffer)) {
    throw new Error('buffer should be a Buffer');
  }

  const dateTime = buffer.readUInt32LE(0);
  const spotCnt = buffer.readUInt16LE(4);
  const spotstat = buffer.readUInt8(6);

  return {
    Time: moment(dateTime * 1000).format('YYYY-MM-DD HH:mm:ss'),
    Status: spotstat,
    Count: spotCnt,
  };
};

/**
 *
 * @param {Buffer} buffer 56 bytes
 */
const deserializePacketLong = buffer => {
  if (!(buffer instanceof Buffer)) {
    throw new Error('buffer should be a Buffer');
  }

  const [x, y, z] = [buffer.readInt16LE(0), buffer.readInt16LE(2), buffer.readInt16LE(4)];
  const magDiff = buffer.readUInt16LE(6);
  const radarDis = buffer.readUInt8(8);
  const radarStrength = buffer.readUInt8(9);
  const radarCoverCnt = buffer.readUInt8(10);
  const radarDiff = buffer.readUInt8(11);
  const rssi = buffer.readUInt8(12);
  const snr = buffer.readInt8(13);
  const mcuTemp = buffer.readInt8(14);
  const qmcTemp = buffer.readInt8(15);
  const [X, Y, Z] = [buffer.readInt16LE(16), buffer.readInt16LE(18), buffer.readInt16LE(20)];
  const dbgVal = buffer.readInt16LE(22);
  const radarVal = buffer.slice(24, 40).join(',');
  const radarback = buffer.slice(40, 56).join(',');

  return {
    x,
    y,
    z,
    MagDiff: magDiff,
    RadarDiff: radarDiff,
    Distance: radarDis,
    RadarStrength: radarStrength,
    CoverCount: radarCoverCnt,
    Rssi: rssi,
    Snr: snr,
    TempCore: mcuTemp,
    TempQmc: qmcTemp,
    xBack: X,
    yBack: Y,
    zBack: Z,
    DebugVal: dbgVal,
    RadarVal: radarVal,
    RadarBack: radarback,
  };
};

const deserializePacketInfo = buffer => {
  if (!(buffer instanceof Buffer)) {
    throw new Error('buffer should be a Buffer');
  }
  try {
    const infoData = JSON.parse(buffer.slice(0, 300).map(val => val.valueOf()));
    return infoData;
  } catch (error) {
    return {};
  }
};

const deserializePrivate = buffer => {
  if (!(buffer instanceof Buffer)) {
    throw new Error('buffer should be a Buffer');
  }
  try {
    const len = buffer.readUInt8(0);
    const qmcData = [];
    // 一组数据 8 bytes
    for (let i = 0; i < len * 8; i += 8) {
      const [x, y, z] = [
        buffer.readInt16LE(i + 1),
        buffer.readInt16LE(i + 3),
        buffer.readInt16LE(i + 5),
      ];
      const [TempQmc, Status] = [buffer.readInt8(i + 7), buffer.readUInt8(i + 8)];
      qmcData.push({ x, y, z, TempQmc, Status });
    }
    return qmcData;
  } catch (error) {
    return [];
  }
};

const deserializeReportMsg = buffer => {
  const packetMsg = deserializePacketMsg(buffer.slice(0, 6));
  const { Type } = packetMsg;
  switch (Type) {
    case 'TMoteStatus': {
      const packet = {
        ...deserializePacketShort(buffer.slice(6, 13)),
        ...deserializePacketLong(buffer.slice(13, 71)),
      };
      return { Name: 'TMoteStatus', TMoteStatus: packet };
    }
    case 'TMoteInfo': {
      const packet = deserializePacketInfo(buffer.slice(6, 306));
      const { TMoteInfo, WorkInfo, RadarDbg } = packet;
      if (TMoteInfo) {
        TMoteInfo.PlatformType = 'MQTT';
        return { Name: 'TMoteInfo', TMoteInfo };
      } else if (WorkInfo) {
        return { Name: 'WorkInfo', WorkInfo };
      } else if (RadarDbg) {
        return { Name: 'RadarDbg', RadarDbg };
      } else {
        return { Name: 'Unknown', Info: packet };
      }
    }
    case 'TMoteHexStr': {
      const packet = deserializePrivate(buffer.slice(6, 166));
      return { Name: 'TMoteHexStr', TMoteHexStr: packet };
    }
    default: {
      return { Name: 'Unknown', Info: buffer.slice(6) };
    }
  }
};

const deserialize = async buffer => {
  if (!(buffer instanceof Buffer)) {
    throw new Error('buffer should be a Buffer');
  }

  const packetHead = deserializePacketHead(buffer.slice(0, 8));
  const { SN } = packetHead;
  const packetBody = deserializeReportMsg(buffer.slice(8));
  packetBody.OwnerInfo = (await userinfo.getOwnerInfo(SN)) || {};
  return { SN, ...packetBody };
};

module.exports = deserialize;
