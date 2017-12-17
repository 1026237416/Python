/**
 * Created by wangahui1 on 16/3/2.
 */
define("alarm",["exports"],function(exports)
{
    //类型
    this.types=
        [
            {
                value:"all",
                label:"全部"
            },
            {
                value:"vm",
                label:$.i18n.prop("server.operate.vm")
            },
            {
                value:"host",
                label:$.i18n.prop("server.operate.host")
            }
        ];
    //级别
    this.levels=
        [
            {
                value:"all",
                label:"全部"
            },
            {
                value:"fatal",
                label:$.i18n.prop("alarm.levels.fatal")
            },
            {
                value:"warning",
                label:$.i18n.prop("alarm.levels.warning")
            },
            {
                value:"notice",
                label:$.i18n.prop("alarm.levels.notice")
            }
        ];
    //获取告警类型列表
    this.getAlarmTypes=function()
    {
        return this.types;
    };
    //获取告警级别列表
    this.getAlarmLevels=function()
    {
        return this.levels;
    };
    //根据值获取告警类型
    this.getType=function(value)
    {
        return ef.util.find(this.types,function(item)
        {
            return item.value==value;
        })||{};
    };
    //根据值获取告警级别
    this.getLevel=function(value)
    {
        return ef.util.find(this.levels,function(item)
        {
            return item.value==value;
        })||{};
    };
});