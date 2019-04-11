const WS = require('ws')

exports.WebsocketClients = function () {
    // this.arrProcessVics             = new Array();        //vics进程
    // this.arrProcessIpps             = new Array();        //ipps进程
    // this.arrProcessUpa              = new Array();        //upa进程
    // this.arrProcessCtiInterface     = new Array();        //CtiInterfacce进程
    // this.arrProcessRecService       = new Array();        //录制服务器
    
    this.arrProcess                 = new Array()       
    this.iSystemMonitorModular      = 0                 //是否使用系统状态监控模块(0：不使用 ，1：使用)
    this.oMonitorModular            = null              //监控模块对象
    this.oInterval                  = null

    var _this = this

    /**
     *   回调函数
     */
    this.CallBack = () => {

    }

    /**
     *   初始化对象
     */
    this.Init = (iSystemMonitorModular) => {
        _this.iSystemMonitorModular = iSystemMonitorModular
        if(1 == _this.iSystemMonitorModular){
            setTimeout(function(){
                _this.StartMonitorProcesses()
                _this.GetRunningStatusFromProcesses()
            },2000)
        }
    }

    /**
     *   初始化Vics(创建对象并连接websocket到进程)
     */
    this.VicsInit = (name,id,ip,port) => {
        let len = _this.arrProcessVics.length
        _this.arrProcessVics[len] = new WebsocketClient()
        _this.arrProcessVics[len].SetBasic(name,id,ip,port,_this.CallBack)
    }

    /**
     *   初始化Ipps(创建对象并连接websocket到进程)
     */
    this.IppsInit = (name,id,ip,port) => {
        let len = _this.arrProcessIpps.length
        _this.arrProcessIpps[len] = new WebsocketClient()
        _this.arrProcessIpps[len].SetBasic(name,id,ip,port,_this.CallBack)
    }

    /**
     *   初始化Upa(创建对象并连接websocket到进程)
     */
    this.UpaInit = (name,id,ip,port) => {
        let len = _this.arrProcessUpa.length
        _this.arrProcessUpa[len] = new WebsocketClient()
        _this.arrProcessUpa[len].SetBasic(name,id,ip,port,_this.CallBack)
    }

    /**
     *   初始化CtiInterface(创建对象并连接websocket到进程)
     */
    this.CtiInterfaceInit = (name,id,ip,port) => {
        let len = _this.arrProcessCtiInterface.length
        _this.arrProcessCtiInterface[len] = new WebsocketClient()
        _this.arrProcessCtiInterface[len].SetBasic(name,id,ip,port,_this.CallBack)
    }
    
    /**
     *   初始化RecService(创建对象并连接websocket到进程)
     */
    this.RecServiceInit = (name,id,ip,port) => {
        let len = _this.arrProcessRecService.length
        _this.arrProcessRecService[len] = new WebsocketClient()
        _this.arrProcessRecService[len].SetBasic(name,id,ip,port,_this.CallBack)
    }

    /** 
     *   所有进程初始化
     */
    this.ProcessInit = (name,id,ip,port) => {
        let len = _this.arrProcess.length
        _this.arrProcess[len] = new WebsocketClient()
        _this.arrProcess[len].SetBasic(name[0],id[0],ip[0],port[0],_this.CallBack)
    }

    /**
     * 打印所有进程的基本信息
     */
    this.ProcessPrintf = () => {
        let len = _this.arrProcess.length
        for(let i = 0; i < len; i ++){
            console.log(`name:${_this.arrProcess[i].strName}  id:${_this.arrProcess[i].strId}  ip:${_this.arrProcess[i].strIp}  port:${_this.arrProcess[i].strPort}`)
        }
    }

    /**
     * 启用系统监控模块监控系统各进程的状态(向各个进程发送获取进程状态命令)
     */
    this.StartMonitorProcesses = () => {
        let len = _this.arrProcess.length
        for(let i = 0; i < len; i ++){
            console.log(_this.arrProcess[i].strName)
            let processType = _this.arrProcess[i].strName.split('')
            if('V' == processType[0] || 'C' == processType[0]){
                console.log('开始监控')
            }else{
                ;
            }
        }
        setInterval(function(){
            _this.StartMonitorProcesses()
        },15000)
    }

    /**
     * 定时向各个进程获取状态
     */
    this.GetRunningStatusFromProcesses = () => {
        let processesStatus = new Array()
        let len = _this.arrProcess.length
        for(let i = 0; i < len; i ++){
            let processType = _this.arrProcess[i].strName.split('')
            if('V' == processType[0] || 'C' == processType[0]){
                let time = new Date()
                processesStatus[i] = _this.arrProcess[i].ResponseRunningStatus(time)
            }else{
                ;
            }
        }
        _this.ArrangementXmlSend(processesStatus)
        delete processesStatus
        setInterval(function(){
            _this.GetRunningStatusFromProcesses()
        },60000)
    }

    /**
     * 整理成xml格式的信息，上报给系统监控模块
     */
    this.ArrangementXmlSend = (processesStatus) => {
        let len = processesStatus.length
        let status = ''
        let txt = `<?xml version="1.0" encoding="UTF-8" ?>
        <Device id="DS300S">
        `
        for(let i = 0; i < len; i ++){
            console.log(processesStatus[i])
            var infor = processesStatus[i].split('#')
            if('1' == infor[4]){
                status = '正常'
            }else{
                status = '不正常'
            }
            txt += `<MP id="${infor[0]}" ip="${infor[2]}" port="${infor[3]}">
            <Quota ID="runstatus" Type="1" Value="${status}" />
            <Quota ID="message" Type ="1" Value=" ${infor[5]}"/>
              </MP>`
        }
        txt += `</Device>`
        console.log(txt)
    }

}


function WebsocketClient () {
    this.oWebsocket = null
    this.strName = ''
    this.strId = ''
    this.strIp = ''
    this.strPort = ''
    this.funProcessStatusCallBack = null
    this.bUse = false                      //连接是否成功
    this.ConnectNum = 0                     //连接次数
    this.con = null                         //消息发送到网页

    this.iRunningState = 1;	                //运行状态 0：不正常，1：正常
    this.strErrorCode = '';	                //错误码
    this.iUpdateStatustime = 0;             //更新状态的时间


    var _this = this

    /** 
     *  设置基本信息 
     */
    this.SetBasic = (name,id,ip,port,callback) => {
        _this.strName = name
        _this.strId = id
        _this.strIp = ip
        _this.strPort = port
        _this.funProcessStatusCallBack = callback
    }

    /**
     *  连接当前进程
     */
    this.Connect = function(){
		var url = "ws://"+_this.strIp+":"+_this.strPort;
		this.ConnectNum ++ ;
		
		_this.oWebsocket = new WS(url);
 
		
		_this.oWebsocket.on("open", function () {

			_this.bUse = true;
			console.log(_this.strName + " connect success ip:" + _this.strIp + ' port:' +  _this.strPort);
			this.ConnectNum = 0;
			
		});
		 
		_this.oWebsocket.on("close", function() {
			_this.bUse = false;
            setTimeout(function(){_this.Connect()},5000);

            _this.UpdateRunningStatus(0,'Websocket Connect error')

			if(_this.ConnectNum <= 5){
				console.log(_this.strName + '进程WebSocket重新连接 ip:' + _this.strIp + ' port:' +  _this.strPort)
			}else{
				console.log(_this.strName + '进程WebSocket连接出错 ip:' + _this.strIp + ' port:' +  _this.strPort);	
            }
            
		});
		 
		_this.oWebsocket.on("message", function(data) {
			// console.log(`${_this.strSvrName} = ${data}`)
			let json = JSON.parse(data);
			if('RunningStateRsp' == json._sCmdType){
				_this.UpdateRunningStatus(json._oInfo._nRunStatus,json._oInfo._sErrorCode)
            }
            // else{
			// 	this.con = null
			// }
		});
    };
    
    /**
     * 发送消息
     */
    this.Send = function(data,con){
        _this.oWebsocket.send(data);
        if(con){
            _this.con = con;
        }
    };
    
    /**
     * 获取进程的运行状态
     */
    this.GetRunningState = () => {
		var strSqnc = ""+ Date.parse(new Date());
		var json = {
			_sSecurity		:	strSqnc,					//时序
			_sCmd			:	'GetRunningState',
			_oPARAMS		: 	{}
        }
        if(_this.bUse){
            _this.oWebsocket.send(JSON.stringify(json));
        }
    }
    
    /**
     * 设置进程的运行状态
     */
    this.UpdateRunningStatus = (runningState,errorCode) => {
        _this.iRunningState = runningState;	                //运行状态 0：不正常，1：正常
        _this.strErrorCode = errorCode;
        _this.iUpdateStatustime = new Date()
    }

    /**
     * 返回进程名称、编号、ip、端口、和运行状态及错误码
     */
    this.ResponseRunningStatus = (time) => {
        if(60000 < (time - this.iUpdateStatustime)){
            return `${_this.strName}#${_this.strId}#${_this.strIp}#${_this.strPort}#${0}#Service Not Received Response`
        }else{
            return `${_this.strName}#${_this.strId}#${_this.strIp}#${_this.strPort}#${_this.iRunningState}#${_this.strErrorCode}`
        }
    }
}
