const soap = require('soap')
const request = require('request')

 exports.MonitorModular = function () {
    this.strReportWay = ''      //上传方式
    this.strIp = ''             //服务器ip
    this.strPort = ''           //服务器端口
    this.strReportMethod = ''   //上传方法

    let _this = this

    /**
     * 初始化(赋值)
     */
    this.Init = (strReportWay,strIp,strPort,strReportMethod) => {
        _this.strReportWay = strReportWay
        _this.strIp = strIp
        _this.strPort = strPort
        _this.strReportMethod = strReportMethod
    }

    /**
     * 上报监控模块(对外接口)
     */
    this.ReportXml = (xml) => {
        if('rest' == _this.strReportWay){
            _this.ReportXmlByRest(xml)
        }else if('webService' == _this.strReportWay){
            _this.ReportXmlBywebService(xml)
        }else{
            console.log(`暂不支持${_this.strReportWay}这种方式上传信息`)
        }
        console.log(xml)
    }

    /**
     * 通过Rest协议上报状态
     * http://192.168.9.165:5010/MonitorApis/SendDatas
     * Method:POST
     */
    this.ReportXmlByRest = (xml) => {
        let url = `http://${_this.strIp}:${_this.strPort}/${_this.strReportMethod}`
        request.post({
            url:url,
	        body:xml
        },(err,response,body)=>{
            if(err){
                console.log(`Rest Report 300sStatus to MonitorModular Error : ${err}`)
            }
            if(body){
                // console.log(`success --- ${body}`)
            }  
        })
    }

    /**
     * 通过webService上报状态
     * 调用地址：http://192.168.5.186:5010/PushDataService
     * 调用方法：PushData (string strXML)
     */
    this.ReportXmlBywebService = (xml) => {
        let url = `http://${_this.strIp}:${_this.strPort}/${_this.strReportMethod}`;
        soap.createClient(url, function(err, client) {
            if(err){
                console.log(`webService Report 300sStatus to MonitorModular Error : ${err}`)
            }else{
                client.PushData (msg, function(err, result) {
                    if(err){
                        console.log(`webService Report 300sStatus to MonitorModular Error : ${err}`)
                    }else{
                        // console.log(result);
                    }
                });
            }
        });
    }
}