const Parkingspaces = require('../mongo/Parkingspaces');

/**
 * 根据地磁号找到新平台主题
 * 20181006@zhangdh 由原来的单纯搜索主题改为获取设备对应用户链的用户信息
 */
const getOwnerInfo = async SN => {
  const owners4spaces = await Parkingspaces.aggregate([
    { $match: { MoteDeviceId: SN } },
    {
      $lookup: {
        from: 'Parkinglots',
        foreignField: 'ParkinglotId',
        localField: 'Parkinglot.ParkinglotId',
        as: 'Parkinglots',
      },
    },
    {
      $lookup: {
        from: 'EnterpriseUsers',
        foreignField: 'EnterpriseUserId',
        localField: 'Parkinglots.Owner.OwnerId',
        as: 'Owner',
      },
    },
    {
      $project: {
        _id: 0,
        Owner: {
          EnterpriseUserName: 1,
          EnterpriseUserId: 1,
          MqttTopic: 1,
          CallbackUrl: 1,
        },
      },
    },
  ]);

  // 因为聚合出来的为一个数组 正常情况下是只存在一台设备 所以只截取第一个匹配项的用户链
  const [owners4space = {}] = owners4spaces;
  const { Owner } = owners4space;
  return Owner;
};

module.exports = { getOwnerInfo };
