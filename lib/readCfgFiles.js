const fs = require('fs')
const os = require('os')
const iconv = require('iconv-lite')
const xml2js = require('xml2js')
const { WebsocketClients } = require('./websocketClients')   //配置文件初始化

var webSocketClients = null
var webServiceInfor = null

exports.readFileInit = function () {
    webServiceInfor = new webServiceAnalyticInfor()
    webServiceInfor.Init()
} 

function webServiceAnalyticInfor () {
    this.strWebServiceAscription    = '';                 //服务归属方
    this.iSystemMonitorModular      = 0;                  //是否使用系统状态监控模块(0：不使用 ，1：使用)

    var _this = this;

    /**
     *   初始化
     */
    this.Init = () => {
        _this.ReadLocalCfg ()
        _this.Read300SNodeInforCfg ()
    }

    /**
     *   读取本地配置文件
     */
    this.ReadLocalCfg = () => {
        fs.readFile('./cfg/300sWebServicecfg.xml',function(err,data){
            if(err){
                console.log('读取300sWebServicecfg.xml配置文件失败')
                _this.WriteLocalCfg()
            }else{
                var buf = iconv.decode(data, 'GBK');
                _this.LocalCfgXml2Json(buf);
            }
        })
    }
    /**
     *   读取拷贝过来的300snodeinfor.xml文件
     */
    this.Read300SNodeInforCfg = () => {
        fs.readFile('./cfg/300snodeInfo.xml',function(err,data){
            if(err){
                console.log('读取300snodeInfo.xml配置文件失败')
                _this.Write300sNodeInforCfg()
            }else{
                var buf = iconv.decode(data, 'GBK');
                _this.NodeInforCfgXml2Json(buf);
            }
        })
    }


    /**
     *   将读取的LocalCfg.xml格式信息转化成json格式
     */
    this.LocalCfgXml2Json = (xml) => {
        xml2js.parseString(xml, function (err, result) {
            if(err){
                console.log(`300sWebServicecfg.xml解析成Json失败，请检查格式是否正确 error : ${err}`)
            }else{
                _this.AnalyticLocalCfgJson(JSON.stringify(result))
            }
        });
    }
    /**
     *   将读取的300sNodeInofrCfg.xml格式信息转化成json格式
     */
    this.NodeInforCfgXml2Json = (xml) => {
        xml2js.parseString(xml, function (err, result) {
            if(err){
                console.log(`300snodeInfo.xml解析成Json失败，请检查格式是否正确 error : ${err}`)
            }else{
                _this.AnalyticNodeInforCfgJson(JSON.stringify(result))
            }
        });
    }

    /**
     *   解析LocalCfg.xml文件中的信息
     */
    this.AnalyticLocalCfgJson = (strJson) => {
        // console.log(strJson)
        let Json = JSON.parse(strJson)
        _this.strWebServiceAscription = Json.nodecfg.webServiceAscription
        _this.iSystemMonitorModular = Json.nodecfg.systemMonitorModular
        // console.log(`_this.strWebServiceAscription : ${_this.strWebServiceAscription } , _this.iSystemMonitorModular : ${_this.iSystemMonitorModular}`)
    }
    /**
     *   解析300sNodeInofrCfg.xml文件中的信息
     */
    this.AnalyticNodeInforCfgJson = (strJson) => {
        // console.log(strJson)
        let Json = JSON.parse(strJson)
        if(!webSocketClients){
            webSocketClients = new WebsocketClients();
            webSocketClients.Init(_this.iSystemMonitorModular)
        }
        for(let v = 0; v < Json.nodecfg.vics.length; v ++){
            // webSocketClients.VicsInit(Json.nodecfg.vics[v].name,Json.nodecfg.vics[v].id,Json.nodecfg.vics[v].ip,Json.nodecfg.vics[v].nmport)
            webSocketClients.ProcessInit(Json.nodecfg.vics[v].name,Json.nodecfg.vics[v].id,Json.nodecfg.vics[v].ip,Json.nodecfg.vics[v].nmport)
        }
        for(let i = 0; i < Json.nodecfg.ipps.length; i ++){
            // webSocketClients.IppsInit(Json.nodecfg.ipps[i].name,Json.nodecfg.ipps[i].id,Json.nodecfg.ipps[i].ip,Json.nodecfg.ipps[i].nmport)
            webSocketClients.ProcessInit(Json.nodecfg.ipps[i].name,Json.nodecfg.ipps[i].id,Json.nodecfg.ipps[i].ip,Json.nodecfg.ipps[i].nmport)
        }
        for(let u = 0; u < Json.nodecfg.upa.length; u ++){
            // webSocketClients.UpaInit(Json.nodecfg.upa[u].name,Json.nodecfg.upa[u].id,Json.nodecfg.upa[u].ip,Json.nodecfg.upa[u].nmport)
            webSocketClients.ProcessInit(Json.nodecfg.upa[u].name,Json.nodecfg.upa[u].id,Json.nodecfg.upa[u].ip,Json.nodecfg.upa[u].nmport)
        }
        for(let c = 0; c < Json.nodecfg.ctiInterface.length; c ++){
            // webSocketClients.CtiInterfaceInit(Json.nodecfg.ctiInterface[c].name,Json.nodecfg.ctiInterface[c].id,Json.nodecfg.ctiInterface[c].ip,Json.nodecfg.ctiInterface[c].nmport)
            webSocketClients.ProcessInit(Json.nodecfg.ctiInterface[c].name,Json.nodecfg.ctiInterface[c].id,Json.nodecfg.ctiInterface[c].ip,Json.nodecfg.ctiInterface[c].nmport)
        }
        for(let r = 0; r < Json.nodecfg.recService.length; r ++){
            // webSocketClients.RecServiceInit(Json.nodecfg.recService[r].name,Json.nodecfg.recService[r].id,Json.nodecfg.recService[r].ip,Json.nodecfg.recService[r].nmport)
            webSocketClients.ProcessInit(Json.nodecfg.recService[r].name,Json.nodecfg.recService[r].id,Json.nodecfg.recService[r].ip,Json.nodecfg.recService[r].nmport)
        }
        webSocketClients.ProcessPrintf()
    }


    /**
     *   创建本地配置文件(当读取本地文件失败是调用)
     */
    this.WriteLocalCfg = () => {
        var flag = _this.CfgFileExistence()
        if(!flag){
            fs.mkdirSync("./cfg/")
        }
        _this.WriteToLocalCfg()
    }
    /**
     *   创建300snodeInfor.xml配置文件(当读取300snodeInfor.xml文件失败是调用)
     */
    this.Write300sNodeInforCfg = () => {
        var flag = _this.CfgFileExistence()
        if(!flag){
            fs.mkdirSync("./cfg/")
        }
        _this.WriteTo300sNodeInforfg()
    }

    /**
     *   查看是否有cfg文件夹
     */
    this.CfgFileExistence = () => {
        var components = []
        var files = fs.readdirSync('./')
        files.forEach(function (item, index) {
            var stat = fs.lstatSync("./" + item)
            if (stat.isDirectory() === true) { 
                components.push(item)
            }
        })
        var len = components.length;
        for(var i = 0; i < len; i ++){
            if('cfg' == components[i]){
                return true;
            }
        }
        return false;
    }

    /**
     *   在创建的文件中写入300sWebServicecfg.xml配置文件
     */
    this.WriteToLocalCfg = () => {
        let xml = _this.LocalCfgDefaultContent()
        fs.writeFile('./cfg/300sWebServicecfg.xml',xml,'utf8',function(error){
            if(error){
                console.log(`LocalCfg Write error : ${error}`);
            }else{   
                console.log('写入成功');
            }
        })
    }
    /**
     *    在创建的文件中写入300snodeInfo.xml配置文件
     */
    this.WriteTo300sNodeInforfg = () => {
        let xml = _this.ds300sNodeInforCfgDefaultContent()
        fs.writeFile('./cfg/300snodeInfo.xml',xml,'utf8',function(error){
            if(error){
                console.log(`300snodeInfoCfg Write error : ${error}`);
            }else{   
                console.log('写入成功,请手动修改300snodeInfo.xml配置文件');
            }
        })
    }

    /**
     *   300sWebServicecfg.xml文件默认内容
     */
    this.LocalCfgDefaultContent = () => {
        let xml = `<?xml version="v1.0" encoding="GB2312" ?>
        <nodecfg>
            <webServiceAscription>上海市局</webServiceAscription>
            <systemMonitorModular>1</systemMonitorModular>
        </nodecfg>`
        return xml;
    }
    /**
     *   300snodeInfo.xml文件默认内容
     */
    this.ds300sNodeInforCfgDefaultContent = () => {
        let xml = `<?xml version="1.0" encoding="GB2312" ?>
        <nodecfg>
            <vics>
                <id>10000</id>
                <name>VICS01</name>
                <ip>127.0.0.1</ip>
                <nmport>4100</nmport>
            </vics>
            <ipps>
                <id>20000</id>
                <name>IPPS01</name>
                <ip>127.0.0.1</ip>
                <nmport>4200</nmport>
            </ipps>
            <upa>
                <type>GB28181</type>
                <id>30600</id>
                <name>GB28181UPA01</name>
                <ip>127.0.0.1</ip>
                <nmport>4370</nmport>
            </upa>
            <upa>
                <type>MT</type>
                <id>30500</id>
                <name>MTUPA01</name>
                <ip>127.0.0.1</ip>
                <nmport>4360</nmport>
            </upa>
            <ctiInterface>
                <id>40000</id>
                <name>CTIINTERFACE01</name>
                <ip>127.0.0.1</ip>
                <nmport>4400</nmport>
            </ctiInterface>
            <recService>
                <id>50000</id>
                <name>RECSERVICE01</name>
                <ip>127.0.0.1</ip>
                <nmport>4500</nmport>
            </recService>

            <globalcfg>
                <hotnum>0000</hotnum>
            </globalcfg>
        </nodecfg>`
        return xml;
    }

}
