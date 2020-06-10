// readStaticFile.js

// 引入依赖的模块
var path = require('path');
var fs = require('fs');
var mime = require('mime');

function readStaticFile(res, filePathname) {
    var ext = path.parse(filePathname).ext;
    var mimeType = mime.getType(ext);

    // 判断路径是否有后缀, 有的话则说明客户端要请求的是一个文件
    if (ext) {
        // 根据传入的目标文件路径来读取对应文件
        fs.readFile(filePathname, (err, data) => {
            // 错误处理
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.write('404 - NOT FOUND');
                res.end();
            } else {
                res.writeHead(200, { 'Content-Type': mimeType });
                res.write(data);
                res.end();
            }
        });
        // 返回 false 表示, 客户端想要的 是 静态文件
        return true;
    } else {
        // 返回 false 表示, 客户端想要的 不是 静态文件
        return false;
    }
}

// 导出函数
module.exports = readStaticFile;
