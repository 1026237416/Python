/**
 * Created by wangahui1 on 16/5/26.
 */
define("framework.server.socket",["module","exports","framework.core"],function(module,exports,ef)
{
    /**
     * socket的传入参数
     * @param {String} url 连接的地址,例如ws://192.168.1.1
     * @param {String} id  socket的唯一标识
     * */
    function Socket(url,id)
    {
        this.url=url;
        this.socket=null;
        this.id=id||undefined;
        this.init();
        Socket._instances.push(this);
    }
    /**@private 类的实例集合*/
    Socket._instances = [];
    /**关闭事件侦听*/
    Socket.prototype.onclose= $.noop;
    /**消息事件侦听*/
    Socket.prototype.onmessage= $.noop;
    /**打开事件侦听*/
    Socket.prototype.onopen= $.noop;
    /**错误事件侦听*/
    Socket.prototype.onerror= $.noop;
    Socket.prototype.init=function()
    {
        var _self=this;
        this.socket=new WebSocket(this.url);
        this.socket.onclose=function()
        {
            return _self.onclose(arguments);
        };
        this.socket.onmessage=function(msg)
        {
            return _self.onmessage(msg);
        };
        this.socket.onopen=function()
        {
            return _self.onopen(arguments);
        };
        this.socket.onerror=function()
        {
            return _self.onerror(arguments);
        };
    };
    /**发送消息
     * @param {String} message 要发送的消息*/
    Socket.prototype.send=function(message)
    {
        return this.socket.send(message);
    };
    /**关闭socket*/
    Socket.prototype.close=function()
    {
        return this.socket.close();
    };
    /**
     * 根据id获取socket对象
     * @static
     * @param {String} id 要获取的id值，字符串
     * */
    Socket.get=function(id)
    {
        if(!id)return false;
        return _.find(this._instances,function(ws)
        {
            return ws.id==id;
        });
    };
    /**@private 注销*/
    Socket._revoke = function (ws) {
        this._instances = _.without(this._instances, ws);
        ws = null;
    };
    /**
     * 销毁socket对象
     * */
    Socket.prototype.destroy=function()
    {
        Socket._revoke(this);
    };
    Socket.closeAll=function()
    {
          $(Socket._instances).each(function(i,socket)
          {
              socket.close();
          });
    };
    ef.register(Socket,"Socket","server");
    return Socket;
});