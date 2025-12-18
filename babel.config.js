module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      // 添加这一行，必须放在最后！
      'react-native-reanimated/plugin',
    ],
  }
}
