'use strict';

const path = require('path');
const { isObject } = require('@temp-cli-dev/utils');
const pkgDir = require('pkg-dir').sync;
const formatPath = require('@temp-cli-dev/format-path');
const npminstall = require('npminstall');
const { getDefaultRegistry } = require('@temp-cli-dev/get-npm-info');

class Package {
    constructor (options) {
        if( !options){
            throw new Error('Package类的options参数不能为空！')
        }
        if( !isObject(options) ){
            throw new Error('Package类的options参数必须为对象！')
        }
        // package路径
        this.targetPath = options.targetPath
        // package的存储路径
        this.storeDir = options.storeDir
        // package的name
        this.packageName = options.packageName
        // package的version
        this.packageVersion = options.packageVersion;
    }

    // 判断当前 package 是否存在
    exists() {}

    // 安装 package
    async install() {
        console.log(this.targetPath, this.packageName, this.packageVersion);
        return npminstall({
            root: this.targetPath,  // 安装
            storeDir: this.storeDir, // 缓存路径
            registry: getDefaultRegistry(),  // 下载源
            pkgs: [
                { 
                    name: this.packageName, // 需要下载的包名
                    version: this.packageVersion  // 包的版本
                }
            ]
        });
    }

    // 更新 package
    update() {}

    // 获取入口文件路径
    getRootFilePath() {
        function _getRootFile(targetPath){
            // 1.获取package.json所在的目录 - pkg-dir
            // pkg-dir 从某个目录开始向上查找，直到找到存在 package.json 的目录，并返回该目录。如果未找到则返回 null
            const dir = pkgDir(targetPath);
            if (dir) {
                // 2.读取package.json - require() js/json/node
                const pkgFile = require(path.resolve(dir, 'package.json'));
                // 3.寻找main/lib - path
                if (pkgFile && pkgFile.main) {
                    // 4.路径的兼容(macOS/windows)
                    return formatPath(path.resolve(dir, pkgFile.main));
                }
            }
            return null;
        }
        if (this.storeDir) {
            return _getRootFile(this.cachFilePath);
        } else {
            return _getRootFile(this.targetPath);
        }
    }
}

module.exports = Package;