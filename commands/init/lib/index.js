'use strict';

const Command = require('@temp-cli-dev/command');
const fs = require('fs');

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
    }

    exec () {
        // 1. 准备阶段
        this.prepare()
        // 2.下载模板
        // 3.安装模板
    }

    prepare () {
        // 1. 判断当前目录是否为空
        const localPath = process.cwd();
        console.log('localPath >>>', localPath);
        let isDirEmptyPath = this.isDirEmpty(localPath);
        if (!isDirEmptyPath) {
            console.log(isDirEmptyPath);
        }
        // 2. 是否启动强制更新
        // 3. 选择创建项目或组件
        // 4.获取项目的基本信息
    }

    isDirEmpty(localPath){
        let fileList = fs.readdirSync(localPath)
        // 文件过滤逻辑
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
          ));
        return !fileList || fileList.length <= 0
    }
}

function init(argv)  {
    return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;