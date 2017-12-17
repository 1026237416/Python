/**
 * Created by wangahui1 on 16/4/19.
 */
/**
 * # Timeline时间轴组件 #
 * {@img timeline.png 时间轴组件示例}
 * # 描述 #
 * Timeline(Class)时间轴组件是为类似于备份的以时间点来管理展示的组件
 *
 * **使用范例**
 *
 *     @example
 *
 *     $(dom).timeline({
         *       data:[//时间轴数据列表
         *           {
         *              label:"2015-08-01",//主标题
         *              value:"我的备份",//副标题
         *              description:"你好你好你好你好你好你好你好"//提示详细信息
         *            },
         *           {label:"2015-09-02",value:"我的备份",description:"你是谁你是谁你是谁你是谁"},
         *           {label:"2015-10-03",value:"我的备份",description:"你好你好你好你好"},
         *           {label:"2015-10-04",value:"我的备份",description:"你好你好你好你好"}
         *       ],
         *       config:null}//config可以覆盖默认配置，比如行宽、行高
 *       ).click(function(obj)//按钮点击事件侦听
 *      {
         *          console.log(obj);
         *          //输出内容如下
         *              //{type: "revert",//返回按钮类型，详见timeline.type枚举对象
          *              //data: {label: "2015-08-01", value: "我的备份", description: "你好你好你好你好你好你好你好"},//改行数据
          *              //index: 0//该行的序号
          *              //}
         *      });/
 *
 * @class ef.components.timeline
 * @return ef.components.timeline
 * */
define("framework.timeline",["exports","framework.core"],function(exports,ef)
{
    function TimeLine(box, data) {
        this.box = box;
        /**生成的该组件的主dom容器*/
        this.container = $('<table class="timeline" cellspacing="0" cellpadding="0"></table>');
        this.tr = $('<tr><td class="timeline-line"></td><td class="timeline-text"><p class="date"></p><p class="desc"></p></td><td class="timeline-operate"></td></tr>');
        this.dot = $('<div class="timeline-dot"></div>');
        if (!data) {
            return
        }
        /**配置参数*/
        this.data = data.data;
        this.init();
        this.setConfig(data.config);
        /**@readonly该组件绘制的起始点x轴*/
        this.posX = this.config.rowWidth / 2;
        /**@readonly该组件绘制的起始点y轴*/
        this.posY = this.config.paddingTop;
        this.callback = $.noop;
        /**按钮类型*/
        this.type =
        {
            /**恢复*/
            REVERT: "revert",//恢复
            /**取消*/
            CANCEL: "cancel"//取消
        };
        this.build();
        return this;
    }
    TimeLine.isDom=true;
    /**@protected 覆盖配置*/
    TimeLine.prototype.setConfig = function (config) {
        if (!config)return;
        for (var i in config) {
            this.config[i] = config[i];
        }

    };
    /**
     * @event click 点击按钮事件
     * @param {Function} callback 点击按钮的回调函数，
     * 参数返回按钮类型、该行的数据、改行数据的序号index,具体见范例
     * */
    TimeLine.prototype.click = function (callback) {
        this.callback = callback ? callback : this.callback;
    };
    /**@protected 初始化*/
    TimeLine.prototype.init = function () {
        this.config =
        {
            /**配置行高*/
            rowHeight: 100,
            /**配置行宽*/
            rowWidth: 50,
            paddingTop: 10
        };
    };
    TimeLine.prototype.build = function () {
        this.box.append(this.container);
        this.createRow();
        this.addListener();
    };
    /**@protected 创建行*/
    TimeLine.prototype.createRow = function () {
        for (var i = 0; i < this.data.length; i++) {
            var _tr = this.tr.clone();
            _tr.data("data", this.data[i]);
            _tr.tooltip(
                {
                    position: 'top',
                    content: this.data[i].description
                });
            this.container.append(_tr);
            _tr.find(".timeline-line").width(this.config.rowWidth);
            _tr.find(".timeline-line").height(this.config.rowHeight);
            var _dot = this.dot.clone();
            _tr.find(".timeline-line").append(_dot);
            _tr.find(".timeline-text .date").text(this.data[i].label);
            _tr.find(".timeline-text .desc").text(this.data[i].value);
            _tr.find(".timeline-operate").append('<a class="icon-btn icon-btn-resume" title="恢复"></a>');
            _tr.find(".timeline-operate").append('<a class="icon-btn icon-btn-delete" title="删除"></a>');

        }
    };
    /**@protected 增加侦听*/
    TimeLine.prototype.addListener = function () {
        var _self = this;
        this.container.find("tr").hover(function () {
            $(this).find(".timeline-operate").show();
            $(this).siblings().find(".timeline-operate").hide();

        }, function () {
            $(this).find(".timeline-operate").hide();
        });
        this.container.find(".timeline-operate").find("a").click(function () {
            var index = $(this).index();
            _self.callback({
                type: index == 0 ? _self.type.REVERT : _self.type.CANCEL,
                data: $(this).parent().parent().data("data"),
                index: $(this).parent().parent().index()
            });
        });
    };
    ef.register(TimeLine,"timeline");
    return TimeLine;
});