module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            // 这里要和 tsconfig.json 里的 paths 对应
            '@': './src',
            '@features': './src/features',
            '@components': './src/components',
            '@hooks': './src/hooks',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@types': './src/types',
          },
        },
      ],
      // 添加这一行，必须放在最后！
      'react-native-reanimated/plugin',
    ],
  }
}
