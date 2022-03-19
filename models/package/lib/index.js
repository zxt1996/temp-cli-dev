'use strict';

const path = require('path');
const { isObject } = require('@temp-cli-dev/utils');
const pkgDir = require('pkg-dir').sync;
const formatPath = require('@temp-cli-dev/format-path');
const npminstall = require('npminstall');
const { getDefaultRegistry, getNpmLatestVersion } = require('@temp-cli-dev/get-npm-info');
const pathExists = require('path-exists').sync;
const fse = require('fs-extra');

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
        // package 的缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_');
    }

    get cacheFilePath() {
        return path.resolve(this.storeDir,`_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    getSpecificCacheFilePath(packageVersion) {
        return path.resolve(this.storeDir,`_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
    }

    async prepare() {
        if (this.storeDir && !pathExists(this.storeDir)) {
            // Ensures that the directory exists. If the directory structure does not exist, it is created.
            fse.mkdirpSync(this.storeDir);
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName);
        }
    }

    // 判断当前 package 是否存在
    async exists() {
        if (this.storeDir) {
            await this.prepare();
            return pathExists(this.cacheFilePath);
        } else {
            return pathExists(this.targetPath);
        }
    }

    // 安装 package
    async install() {
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
    async update() {
        //获取最新的npm模块版本号
      const latestPackageVersion = await getNpmLatestVersion(this.packageName);
      // 查询最新版本号对应的路径是否存在
      const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
      // 如果不存在，则直接安装最新版本
      if(!pathExists(latestFilePath)){
          await npminstall({
              root:this.targetPath,
              storeDir:this.storeDir,
              registry:getDefaultRegistry(),
              pkgs:[{
                      name:this.packageName,
                      version:latestPackageVersion
                      }
              ]
          })
          this.packageVersion = latestPackageVersion
      } else {
          this.packageVersion = latestPackageVersion
      }
      return latestFilePath;
    }

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