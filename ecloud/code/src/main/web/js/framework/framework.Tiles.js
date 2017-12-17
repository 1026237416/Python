/**
 * Created by wangahui1 on 16/7/11.
 */
;define("framework.tiles",["exports","framework.core"],function(exports,ef)
{
    function Tiles(box,data,config)
    {
        this.init();
        _.copy(config,this.config);
        this.render();
    }
    Tiles.prototype.init=function()
    {
        this.config={
            column:3,
            row:2,
            isAuto:true
        };
    };
    Tiles.isDom=true;
    Tiles.prototype.render=function()
    {

    };
    ef.register(Tiles,"tiles");
    return Tiles;
});