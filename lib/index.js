const http = require('http')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const { readFileInit } = require('./readCfgFiles')   //配置文件初始化

module.exports = {
	
	webServiceInit:function(){

		// const serve = serveStatic('html',{'index':['index.html','index.htm']})

		// const server = http.createServer(function onRequest (request,response){
		// 	serve(request,response,finalhandler(request,response))
		// })

		// server.listen(8325)

		// console.log('Server running at http://127.0.0.1:8325/')

        readFileInit()

	}

}