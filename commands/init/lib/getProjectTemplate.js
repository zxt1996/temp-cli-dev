module.exports = function () {
    // 这里在生产环境中可以搭配后端使用 axios 请求来获取数据
    // 进而拥有更高的可配置性
    return [{
        name: 'vue2标准模板',
        npmName: 'imooc-cli-dev-template-vue2',
        version: '1.0.0'
    },{
        name: 'vue3标准模板',
        npmName: 'imooc-cli-dev-template-vue2',
        version: '1.0.0'
    }];
}