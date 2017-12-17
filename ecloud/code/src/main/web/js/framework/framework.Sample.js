define("framework.sample",["exports","framework.core"],function(exports,ef){
    /**
     * 新建Sample类
     * */
    function Sample(box,data)
    {
        this.box=box;
        this.data=data;
        this.template=$("<span></span>");
        this.color="#ff0000";
        this.render();
        return this;
    }
    Sample.prototype.render=function()
    {
        this.box.append(this.template);
        this.template.text(this.data.label);
    };
    Sample.prototype.show=function()
    {
        this.template.show();
    };
    Sample.prototype.hide=function()
    {
        this.template.hide();
    };
    Sample.isDom=true;//true注册为dom,可通过$(dom).sample({label:"test"})访问
    Sample.isIntance=false;
    ef.register(Sample);//为ef注册组件
    return Sample;//导出Sample
});