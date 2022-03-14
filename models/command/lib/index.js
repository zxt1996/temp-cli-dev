'use strict';

const semver = require('semver');
const colors = require('colors/safe');

const  LOWEST_NODE_VERSION = '12.0.0';

class Command {
    constructor (argv) {
        if (!argv) {
            throw new Error('argv参数不能为空');
        }
        if (!Array.isArray(argv)) {
            throw new Error('argv参数必须为数组');
        }
        if (argv.length < 1) {
            throw new Error('参数列表为空');
        }
        this._argv = argv;
        let runner = new Promise((resolve, reject) => {
            let chain = Promise.resolve();
            chain = chain.then(() => this.checkNodeVersion());
            chain = chain.then(() => this.initArgs());
            chain = chain.then(() => this.init());
            chain = chain.then(() => this.exec());
            chain.catch(e => {
                console.log(e.message);
            })
        })
    }

    // 检查 node 版本
    checkNodeVersion () {
        const currentVersion = process.version; // 当前 Node 版本
        const lastVersion = LOWEST_NODE_VERSION;
        // gte(v1, v2): v1 >= v2
        if (!semver.gte(currentVersion, lastVersion)) {
            throw new Error(colors.red(`当前脚手架需要安装v${lastVersion}以上版本的Node.js`));
        }
    }

    // 参数分解
    initArgs () {
        const len = this._argv.length - 1;
        this._cmd = this._argv[len];
        this._argv = this._argv.slice(0, len);
    }

    init () {
        throw Error('init必须实现')
    }

    exec () {
       throw Error('exec必须实现')
    }
}

module.exports = Command;