'use strict';

const log = require('npmlog');
const semver = require('semver');
const userHome = require('user-home'); // 获取当前用户主目录
const pathExists = require('path-exists').sync; // 判断目录是否存在
const colors = require('colors');

// 加载 .json 时会使用 JSON.parse 进行转换编译从而得到一个 json 对象
const pkg = require('../package.json');

const LOWEST_NODE_VERSION = '12.0.0'; // 当前可用的最低 node 版本

module.exports = core;

function core() {
    prepare();
}

// 准备阶段
function prepare () {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
}

// 检查版本
function checkPkgVersion () {
    log.info('cli', pkg.version);
}

// 检查 node 版本
function checkNodeVersion () {
    const currentVersion = process.version; // 当前 Node 版本
    const lastVersion = LOWEST_NODE_VERSION;
    // gte(v1, v2): v1 >= v2
    if (!semver.gte(currentVersion, lastVersion)) {
        throw new Error(colors.red(`当前脚手架需要安装v${lastVersion}以上版本的Node.js`));
    }
}

// 检查登录账号的级别，是否需要降级
function checkRoot () {
    //使用后，检查到root账户启动，会进行降级为用户账户
    const rootCheck = require('root-check');
    rootCheck();
}

// 检查用户主目录
function checkUserHome () {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前登录用户主目录不存在!!!'));
    }
}