#! /usr/bin/env node

const importLocal = require('import-local');

// 判断 importLocal(__filename) 为 true 的时候 会输出一行 log 
// 判断本地 `node_modules` 中是否存在脚手架
// __filename: 返回当前模块文件被解析过后的绝对路径
if (importLocal(__filename)) {
  require('npmlog').info('cli', '正在使用 temp-cli-dev 本地版本');
} else {
  require('../lib')(process.argv.slice(2));  //从进程中获取参数
}