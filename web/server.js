// server.js

// 引入相关模块
var http = require('http');
var url = require('url');
var path = require('path');
var readStaticFile = require('./readStaticFile');

// 搭建 HTTP 服务器
var server = http.createServer(function(req, res) {
    var urlObj = url.parse(req.url);
    var urlPathname = urlObj.pathname;
    var filePathname = path.join(__dirname, '/dist', urlPathname);
    console.log(`read file ${filePathname}`);
    // 读取静态文件
    readStaticFile(res, filePathname);
});

// 在 3000 端口监听请求
server.listen(8080, function() {
    console.log('服务器运行中.');
    console.log('正在监听 8080 端口:');
});
