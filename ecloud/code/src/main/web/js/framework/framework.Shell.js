/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.shell",["exports","framework.core"],function(exports,ef)
{
    console.log("shell:");
    require(["framework.core","framework.timeline","framework.topo","framework.ip","framework.incrementNum","framework.timer",
            "framework.iconmenu","framework.sessionStorage","framework.iconstep","framework.viewstack",
            "framework.coor","framework.interface","framework.placard","framework.backup","framework.upload",
            "framework.buttonstep","framework.preload","framework.switch","framework.sequenceLoader",
            "framework.dialog","framework.event","framework.loading","framework.localStorage","framework.nav",
            "framework.terminal","framework.download","framework.alert","framework.sliceUpload",
            "framework.iconchange","framework.squire","framework.appBlock","framework.param","framework.checkinfo",
            "framework.coverlayer","framework.dataScroll","framework.dataCenter","framework.cn2uni","framework.server.socket","framework.picker",
            "framework.tiles","framework.uploadLoading","framework.cidrWidget","framework.cidrX",
            "framework.ipLegend","framework.lift","framework.topoNew","framework.breadcrumbs",
            "framework.resultList","framework.notification","framework.messager","framework.scrollBar"
        ]);

});