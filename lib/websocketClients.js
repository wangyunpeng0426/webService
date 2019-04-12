const WS = require('ws')
const { WebsocektService } = require('./websocektService')  //websocket服务端

exports.WebsocketClients = function () {
    this.arrProcess                 = new Array()       
    this.oSystemMonitorModular      = null              //监控模块对象
    this.oInterval                  = null
    this.oWebsocketService          = null              //系统websocketService端对象
    this.oSelfCheckConnect          = null              //当自检完成时，需要上报的连接
    this.arrSelfCheckProcess        = new Array()       //需要自检的进程

    var _this = this

    /**
     *   websocketService回调函数
     */
    this.WebsocketServiceCallBack = (oJson,conn) => {
        if('SystemMonitor' == oJson._sCmd && 'service' == oJson._sMsgToWhom){
            switch (oJson._sMsgType){
                case 'GetProcessesInfo':{               //获取进程信息
                    _this.HandleGetProcessesInfo(oJson,oConnect)
                    break;
                };
                case 'SelfCheck':{                      //开始自检
                    _this.HandleSelfCheck(oJson,oConnect)
                    break;
                };
                case 'GetProcessesSelfCheckInfo':{      //获取各个进程的自检信息
                    _this.HandleGetProcessesSelfCheckInfo(oJson,oConnect)
                    break;
                };
                default:{
                    break;
                }
            }
        }
    }

    /**
     *   初始化对象
     */
    this.Init = (oSystemMonitorModular) => {
        _this.oWebsocketService = new WebsocektService()
        _this.oWebsocketService.Init(_this.WebsocketServiceCallBack)
        _this.oSystemMonitorModular = oSystemMonitorModular
        if(_this.oSystemMonitorModular){
            setInterval(function(){
                _this.StartMonitorProcesses()
            },15000) 
            setInterval(function(){
                _this.GetRunningStatusFromProcesses()
            },60000)
        }
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
            let processType = _this.arrProcess[i].strName.split('')
            if('V' == processType[0] || 'C' == processType[0]){
                _this.arrProcess[i].GetRunningState()
            }else{
                ;
            }
        }
    }

    /**
     * 定时向各个进程获取状态
     */
    this.GetRunningStatusFromProcesses = () => {
        let processesStatus = new Array()
        let index = 0;
        let len = _this.arrProcess.length
        for(let i = 0; i < len; i ++){
            let processType = _this.arrProcess[i].strName.split('')
            if('V' == processType[0] || 'C' == processType[0]){
                let time = new Date()
                processesStatus[index] = _this.arrProcess[i].ResponseRunningStatus(time)
                index ++
            }else{
                ;
            }
        }
        _this.ArrangementXmlSend(processesStatus)
        delete processesStatus
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
            if(processesStatus[i]){
                var infor = processesStatus[i].split('#')
                if('1' == infor[4]){
                    status = '正常'
                }else{
                    status = '异常'
                }
                txt += `
                <MP id="${infor[0]}" ip="${infor[2]}" port="${infor[3]}">
                    <Quota ID="runstatus" Type="1" Value="${status}" />
                    <Quota ID="message" Type ="1" Value=" ${infor[5]}"/>
                </MP>`
            }
        }
        txt += `
        </Device>`
        _this.oSystemMonitorModular.ReportXml(txt)
    }

    /**
     * 处理获取所有进程的详细信息
     */
    this.HandleGetProcessesInfo = (oJson,oConnect) => {
        let json = {
            _sSecurity      : oJosn._sSecurity,
            _sCmdType       : 'SystemMonitor',
            _sMsgFromWhom   : 'service',
            _sMsgType       : 'GetProcessesInfoRsp',
            _nResult        : 0,
            _oInfo          : {
                _nProcessNumber     :  _this.arrProcess.length,
                _aProcessInfor      :   []
            }
        }
        for(let i = 0; i < _this.arrProcess.length; i++){
            let element = 
                {
                    _sProcessName	: 	_this.arrProcess[i].strName,
                    _sProcessId     :   _this.arrProcess[i].strId,
                    _sProcessIp		:   _this.arrProcess[i].strIp,
                    _sProcessPort	:   _this.arrProcess[i].strPort,
                    _sProcessBuse	:   _this.arrProcess[i].bUse
                }
            json._oInfo._aProcessInfor.push(element);
        }
        oConnect.sendText(JSON.stringify(json))
    }

    /**
     * 开始对300s系统自检
     * 返回错误码   （0:） （10011:webService正在进行自检）
     */
    this.HandleSelfCheck = (oJson,oConnect) => {
        let nResult = 0
        if(!_this.oSelfCheckConnect){
            _this.oSelfCheckConnect = oConnect
            let len = oJson._oPARAMS._nProcessesNumber
            for(let i = 0;i < len; i ++){
                _this.arrSelfCheckProcess[i] = oJson._oPARAMS._nProcessesInfo[i]._n300sNodeId
            }
            _this.WebServiceStartSelfCheck()
        }else{
            nResult = 10011
        }
        let json = {
            _sSecurity      : oJosn._sSecurity,
            _sCmdType       : 'SystemMonitor',
            _sMsgFromWhom   : 'service',
            _sMsgType       : 'SelfCheckRsp',
            _nResult        : nResult,
            _oInfo          : {}
        }
    }

    /**
     * WebService开始对300s系统进行自检
     */
    this.WebServiceStartSelfCheck = (processName) => {
        let len = _this.arrProcess.length
        let index = 0;
        for(let i = 0; i < len; i ++){
            let processType = _this.arrProcess[i].strName.split('')
            if('V' == processType[0]){
                index = i
                break
            }
        }
        if(0 != _this.arrSelfCheckProcess.length){
            _this.arrProcess[index].
        }
        
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
        _this.Connect()
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
            console.log(`${_this.strName} Receive Msg : ${data}`)
			let oJson = JSON.parse(data);
			if('RunningStateRsp' == oJson._sCmdType){
				_this.UpdateRunningStatus(oJson._oInfo._nRunStatus,oJson._oInfo._sErrorCode)
            }else if('SelfCheckRsp' == oJson._sCmdType){
                if(0 == oJson._nResult){
                    _this.funProcessStatusCallBack('SelfCheckRsp',oJson._oInfo._n300sNodeId,oJson._nResult)
                }
            } 
		});
    };
    
    /**
     * 发送消息
     */
    this.Send = function(data,con){
        _this.oWebsocket.send(data);
        console.log(`${_this.strName} Send Msg : ${data}`)
        if(con){
            _this.con = con;
        }
    };
    
    /**
     * 获取进程的运行状态
     */
    this.GetRunningState = () => {
		let strSqnc = ""+ Date.parse(new Date());
		let json = {
			_sSecurity		:	strSqnc,					//时序
			_sCmd			:	'GetRunningState',
			_oPARAMS		: 	{}
        }
        if(_this.bUse){
            // _this.oWebsocket.send(JSON.stringify(json));
            _this.Send(JSON.stringify(json));
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

    /**
     * 开始自检进程
     * 参数 ： 进程的编号
     */
    this.StartSelfCheck = (nodeId) => {
        let strSqnc = ""+ Date.parse(new Date());
		let json = {
			_sSecurity		:	strSqnc,					//时序
			_sCmd			:	'SelfCheck',
			_oPARAMS		: 	{
                _n300sNodeId    : nodeId
            }
        }
        if(_this.bUse){
            _this.Send(JSON.stringify(json));
        }
    }
}
