'use strict';

const log = require('npmlog');
const semver = require('semver');
const userHome = require('user-home'); // 获取当前用户主目录
const pathExists = require('path-exists').sync; // 判断目录是否存在
const colors = require('colors');
const path = require('path');
const commander = require('commander');

const init = require('@temp-cli-dev/init');

const program = new commander.Command();

// 加载 .json 时会使用 JSON.parse 进行转换编译从而得到一个 json 对象
const pkg = require('../package.json');

const LOWEST_NODE_VERSION = '12.0.0'; // 当前可用的最低 node 版本

module.exports = core;

async function core() {
    try {
        await prepare();
        registerCommand();
    } catch (e) {
        log.error(e.message);
        if (process.env.LOG_LEVEL === 'verbose') {
            console.log(e);
        }
    }
}

// 准备阶段
async function prepare () {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    // checkInputArgs();
    checkEnv();
    await checkGlobalUpdate();
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

// 检查入参
function checkInputArgs() {
    const minimist = require('minimist');
    let args = minimist(process.argv.slice(2));
    checkArgs(args);
}

function checkArgs(args) {
    if (args.debug) {
        process.env.LOG_LEVEL = 'verbose';
    } else {
        process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
}

// 检查环境变量
function checkEnv () {
    const dotenv = require('dotenv');
    const dotenvPath = path.resolve(__dirname, '../../../.env');
    if (pathExists(dotenvPath)) {
        // config will read your .env file, parse the contents, assign it to process.env, 
        // and return an Object with a parsed key containing the loaded content or an error key if it failed.
        dotenv.config({
            path: dotenvPath
        });
    }
    log.info('环境变量', process.env.CLI_HOME_PORT);
}

function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
    } else {
        cliConfig['cliHome'] = path.join(userHome, constants.DEFAULT_CLI_HOME);
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

// 检查是否是最新版本，是否需要更新
async function checkGlobalUpdate() {
    //1.获取当前版本号和模块名
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    //2.调用npm API,获取所有版本号
    const { getNpmSemverVersion } = require('@temp-cli-dev/get-npm-info');
    //3.提取所有版本号，比对哪些版本号是大于当前版本号
    const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        //4.获取最新的版本号，提示用户更新到该版本
        log.warn(colors.yellow(`请手动更新${npmName},当前版本:${currentVersion},最新版本:${lastVersion} 
                    更新命令:npm install -g ${npmName}`))
    }
}

// 命令注册
function registerCommand () {
    // option：选项
    // 用法：.option('-n, --name <name>', 'your name', 'jsliang')
    // 第一个参数是选项定义，可以用 |，, 和 ' ' 空格连接
    // 第二个参数为选项描述
    // 第三个参数为选项参数默认值（可选）
    program.name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调式模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');

    // The argument may be <required> or [optional]
    program.command('init [projectName]')
        .option('-f, --force', '是否强制初始化项目')
        .action(init);

    // .on : custom event listeners
    // 开启 debug 模式
    program.on('option:debug', function() {
        if (program.opts().debug) {
            process.env.LOG_LEVEL = 'verbose';
        } else {
            process.env.LOG_LEVEL = 'info';
        }

        log.level = process.env.LOG_LEVEL;
        log.verbose('test');
    })

    //指定targetPath
    // 是否执行本地代码，我们通过一个属性来进行标识：targetPath
    program.on('option:targetPath', function () {
        // 将命令中的参数写入环境变量中实现解耦，不同的项目都可访问到该变量
        process.env.CLI_TARGET_PATH = program.opts().targetPath;
    });

    // 对未知命令监听
    program.on('command:*', function(obj) {
        const availableCommands = program.commands.map(cmd => cmd.name())
        console.log(colors.red('未知的命令：'+obj[0]));
        if(availableCommands.length > 0){
            console.log(colors.red('可用命令为：'+availableCommands.join(',')))
        }
    })

    program.parse(program.argv);
    if (program.args && program.args.length < 1) {
        program.outputHelp();
    }
}