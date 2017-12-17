/**
 * Created by ahuiwang on 2016/10/31.
 */
/**
 * Created by ahuiwang on 2016/10/28.
 */
define("framework.notification",["exports","module","framework.core"],function(exports,module,ef)
{
    /**配置文件*/

    function Notification()
    {
        return this;
    }
    /**
     * config:
     * {
     *      message:"通知提醒标题，必选"，
     *      description："通知提醒内容，必选"，
     *      icon:"自定义图标class",
     *      onClose:点击默认关闭按钮时触发的回调函数,
     *      duration:默认 5 秒后自动关闭，配置为 null 则不自动关闭,
     *      render:function(){//修改渲染消息}
     * }
     *
     *
     *
     * **/
    function Message(config)
    {
        this.tm=null;
        this.id=_.uniqueId("message_un_");
        this.config={
            duration:4500,
            message:"",
            description:"",
            icon:"",
            onClose:$.noop,
            render:function(text)
            {
                var $dom=$('<span></span>');
                $dom.text(text||this.description);
                return $dom;
            }
        };
        _.copy(config,this.config);
        this.tempalte=$('<div class="ef-notification"><div class="ef-notification-notice"><i class="ef-notification-icon"></i>' +
            '<div class="ef-notification-notice-content"><div class="ef-notification-notice-message">' +
            '' +
            '</div><div class="ef-notification-notice-description">' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<a tabindex="0" class="ef-notification-notice-close"><span class="ef-notification-notice-close-x"></span></a>'+
            '</div></div>');
        this.render();
        $(document.body).append(this.tempalte);
        this.tempalte.addClass("ease-in");
        this.tempalte.find(".ef-notification-icon").addClass(this.config.icon);
        if(!this.config.icon)
        {
            this.tempalte.find(".ef-notification-icon").remove();
        }
        var that=this;
        Notification.messages.push(this);
        this.tempalte.find(".ef-notification-notice-close").click(function()
        {
            clearTimeout(that.tm);
            that.movesDown();
            that.__close();
        });
        this.destroy();
        this.movesUp();
    }
    Message.prototype.movesDown=function()
    {
        var currentIndex=_.indexOf(Notification.messages,this);
        _.each(Notification.messages,function(message,index)
        {
            if(index<=currentIndex)
            {
                message.move(index,true);
            }
        });
    };
    Message.prototype.movesUp=function()
    {
        _.each(Notification.messages,function(message,index)
        {
            message.move(index);
        });
    };
    Message.prototype.render=function()
    {
        this.tempalte.find(".ef-notification-notice-message").text(this.config.message);
        this.tempalte.find(".ef-notification-notice-description").html(this.config.render(this.config.description));
    };
    Message.prototype.__close=function()
    {
        this.hide();
        this.config.onClose();
        Notification.messages=_.without(Notification.messages,this);
    };
    Message.prototype.move=function(index,isDelete)
    {
        this.tempalte.stop();
        if(isDelete)
        {
            var bottom=this.tempalte.css("bottom");
            bottom=bottom.replace(/px$/,"");
            console.log(bottom);
            this.tempalte.animate({bottom:bottom-this.tempalte.height()});
        }else
        {
            this.tempalte.animate({"bottom":"+"+((Notification.messages.length-index-1)*this.tempalte.height()+10)+"px"},100);
        }
    };
    Message.prototype.destroy=function()
    {
        var that=this;
        this.tm=setTimeout(function()
        {
            clearTimeout(that.tm);
            that.__close();
        },this.config.duration);
    };
    Notification.isInstance=true;
    Notification.messages=[];
    Message.prototype.hide=function()
    {
        var that=this;
        this.tempalte.removeClass("ease-int").addClass("ease-out");
        setTimeout(function()
        {
            that.tempalte.remove();
        },300);
    };
    Notification.prototype.show=function(config)
    {
        new Message(config);
    };
    ef.register(Notification,"notification");
    return Notification;
});