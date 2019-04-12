const ws = require('nodejs-websocket')

exports.WebsocektService = function () {
    this.arrConnect = new Array()
    this.funWebsocketClientsCallBack = null

    let _this = this

    /**
     * 初始化
     */
    this.Init = (callback) => {
        _this.funWebsocketClientsCallBack = callback
        _this.CreateWebsocketService ()
    }

    /**
     * 创建websocketService
     */
    this.CreateWebsocketService = () => {
        let server = ws.createServer(function(conn) {
            // console.log("New connection") 
            _this.AppendConnectMember(conn)
		    conn.on("text", function(str){
		        _this.HandleMessage(str,conn)
		    })

		    conn.on("close", function(code, reason) {
		    	_this.DeleteConnectMember(conn)
		    })

		    conn.on("error", function(err) {

		    })

        }).listen(4780)
        
        console.log("Websocket Service listening port 4780")
    }

    /** 
     * 添加websocket客户端的连接对象
    */
    this.AppendConnectMember = (conn) => {
        let len = _this.arrConnect.length
        let flag = false
        for(let i = 0; i < len; i++){
            if(conn == _this.arrConnect[i]){
                flag = true
            }
        }
        if(!flag){
            let newConnect = new WebConnService()
            newConnect.Init(conn,_this.funWebsocketClientsCallBack)
            _this.arrConnect.push(newConnect)
        }
    }


    /**
     * 删除websocket客户端的连接对象
     */
    this.DeleteConnectMember = (conn) => {
        let len = _this.arrConnect.length
        for(let i = 0; i < len; i++){
            if(conn == _this.arrConnect[i]){
                delete _this.arrConnect[i]
                _this.arrConnect.splice(i,1)
                break;
            }
        }
    }

    /**
     * 处理消息，当前如果是第一条消息时，判断连接服务的客户端类型
     */
    this.HandleMessage = (msg,conn) => {
        let len = _this.arrConnect.length
        for(let i = 0; i < len; i ++){
            if(conn == _this.arrConnect[i]){
                _this.arrConnect[i].HandleMessage(msg)
                break;
            }
        }
    }

}

function WebConnService () {

    this.strWebType = ''        //网页连接的类型    系统监控(SystemMonitor) 业务功能(BusinessFunctions)
    this.oConnect = null        //连接对象
    this.funWebsocketClientsCallBack = null
    let _this = this;

    /**
     * 初始化
     */
    this,Init = (oConnect,callback) => {
        _this.oConnect = oConnect
        _this.funWebsocketClientsCallBack = callback
    }

    /**
     * 消息处理
     */
    this.HandleMessage = (msg) => {
        let oJson = JSON.parse(msg)
        if(!_this.strWebType){
            if('SystemMonitor' == oJson._sCmd){
                _this.strWebType = 'SystemMonitor'
            }else{
                _this.strWebType = 'BusinessFunctions'
            }
        }
        if('SystemMonitor' == _this.strWebType){
            // _this.funWebsocketClientsCallBack(json,_this.oConnect)
            if('SystemMonitor' == oJson._sCmd && 'service' == oJson._sMsgToWhom){
                switch (oJson._sMsgType){
                    case 'Login':{                          //登陆
                        _this.HandleLogin(oJson)
                        break;
                    };
                    case 'Logout':{                         //登出
                        _this.HandleLogout(oJson)
                        break;           
                    };
                    case 'HeartBeat':{                      //心跳
                        _this.HandleHeartBeat(oJson)
                        break;
                    };
                    // case 'GetProcessesInfo':{               //获取进程信息
                    //     _this.funWebsocketClientsCallBack(oJson,_this.oConnect)
                    //     break;
                    // };
                    // case 'SelfCheck':{                      //开始自检
                    //     _this.funWebsocketClientsCallBack(oJson,_this.oConnect)
                    //     break;
                    // };
                    // case 'GetProcessesSelfCheckInfo':{      //获取各个进程的自检信息
                    //     _this.funWebsocketClientsCallBack(oJson,_this.oConnect)
                    //     break;
                    // };
                    default:{
                        _this.funWebsocketClientsCallBack(oJson,_this.oConnect)
                        break;
                    }
                }
            }
        }
    }

    /**
     * 登陆
     * 返回错误码 （0 登陆成功）（10011 用户名错误）（10012 密码错误）
     */
    this.HandleLogin = (oJosn){
        let nResult = 0
        if('develope' != oJosn._oPARAMS._sUserName){
            nResult = 10011
            if('ds110119' != oJosn._oPARAMS._sPasswd){
                nResult = 10012
            }
        }
        let json = {
            _sSecurity      : oJosn._sSecurity,
            _sCmdType       : 'SystemMonitor',
            _sMsgFromWhom   : 'service',
            _sMsgType       : 'LoginRsp',
            _nResult        : nResult,
            _oInfo        : {}
        }
        _this.oConnect.sendText(JSON.stringify(json))  
    }

    /**
     * 登出
     * 
     */
    this.HandleLogout = (oJson) => {
        let nResult = 0
        let json = {
            _sSecurity      : oJosn._sSecurity,
            _sCmdType       : 'SystemMonitor',
            _sMsgFromWhom   : 'service',
            _sMsgType       : 'LogoutRsp',
            _nResult        : nResult,
            _oInfo        : {}
        }
        _this.oConnect.sendText(JSON.stringify(json))  
    }

    /**
     * 心跳
     */
    this.HandleHeartBeat = (oJson) => {
        let nResult = 0
        let json = {
            _sSecurity      : oJosn._sSecurity,
            _sCmdType       : 'SystemMonitor',
            _sMsgFromWhom   : 'service',
            _sMsgType       : 'HeartBeatRsp',
            _nResult        : nResult,
            _oInfo        : {}
        }
        _this.oConnect.sendText(JSON.stringify(json))  
    }

}