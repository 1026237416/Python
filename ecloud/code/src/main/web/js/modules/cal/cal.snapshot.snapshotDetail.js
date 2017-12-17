define(["module"],function(module)
{
    var implement=new ef.Interface.implement();
    implement.redraw= function () {
        var _data=[{
            "id":1,
            "text":"完成部署",
            "iconCls":"icon-save",
            "children":[{
                "text":"部署1",
                "checked":true
            },{
                "text":"Books",
                "state":"open",
                "attributes":{
                    "url":"/demo/book/abc",
                    "price":100
                },
                "children":[{
                    "text":"部署01",
                    "checked":true
                },{
                    "id": 8,
                    "text":"部署02",
                    "state":"closed"
                }]
            }]
        },{
            "text":"部署2",
            "state":"closed",
            "children":[{
                "text":"部署11"
            },{
                "text":"部署12"
            }]
        }];
        $('.snapshot-box').tree({
            data:_data
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});/**
 * Created by 韩雪飞 on 2015/11/18.
 */
