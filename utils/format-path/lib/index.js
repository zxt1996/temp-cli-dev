'use strict';

const path = require('path');

module.exports = formatPath;

// 路径的兼容（macOS/windows）
function formatPath(nowPath) {
    const sep = path.sep;
    if (nowPath && typeof nowPath === 'string' && sep !== '/') {
        return nowPath.replace(/\\/g, '/');
    }

    return nowPath;
}
