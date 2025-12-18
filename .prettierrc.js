module.exports = {
  // 1. 箭头函数只有一个参数时，省略括号 (x) => {} 变为 x => {}
  arrowParens: 'avoid',
  
  // 2. 关键配置：JSX 的闭合标签 > 是否换行
  // true: <View style={...}>
  // false: 
  // <View 
  //   style={...}
  // >
  // 在 RN 中建议设为 true，避免布局因为多余的换行产生微小差异
  bracketSameLine: true,
  
  // 3. 对象括号两边加空格 { a: 1 } 而不是 {a: 1}
  bracketSpacing: true,
  
  // 4. 使用单引号，而不是双引号
  singleQuote: true,
  
  // 5. 尾随逗号：在对象或数组最后一个元素后面加逗号 (方便 git diff)
  trailingComma: 'all',
  
  // 6. 每行最大宽度，超过换行 (通常 80 或 100)
  printWidth: 100,
  
  // 7. 结尾不加分号 (React Native 社区很流行不写分号，如果你习惯写，改为 true)
  semi: false, 
};