/**
 * Created by ahuiwang on 2016/8/26.
 */
;define("framework.ipLegend", ["exports", "framework.core"], function (exports, ef) {
    /**
     * data:
     * {
                    unselect:18,
                    selected:10,
                    hostOccupy:2,
                    tenantOccupy:2,
                    dhcp:1,
                    gateway:2
                }
     *
     * */
    function IPLegend(box,data)
    {
        this.box=box;
        this.data=data;
        this.contatiner=$('<ul class="ip-legend">' +
            '<li class="square_unselect">' +
                '<span class="legend_square ip_square_unselect"></span>' +
                '<span class="legend_text" i18n="iplegend.unselect.label"></span>' +
                '<p class="legend_count_p"><span>(</span><span class="legend_count">0</span><span>)</span></p></li>' +
            '<li class="square_selected">' +
                '<span class="legend_square ip_square_selected"></span>' +
                '<span class="legend_text" i18n="iplegend.selected.label"></span>' +
                '<p class="legend_count_p"><span>(</span><span class="legend_count">0</span><span>)</span></p></li>' +
            '<li class="square_occupy_host">' +
                '<span class="legend_square ip_square_occupy_host"></span>' +
                '<span class="legend_text" i18n="iplegend.occupy.host.label"></span>' +
                '<p class="legend_count_p"><span>(</span><span class="legend_count">0</span><span>)</span></p></li>' +
            '<li class="square_occupy">' +
                '<span class="legend_square ip_square_occupy"></span>' +
                '<span class="legend_text" i18n="iplegend.occupy.label"></span>' +
                '<p class="legend_count_p"><span>(</span><span class="legend_count">0</span><span>)</span></p></li>' +
            '<li class="square_dhcp_edit">' +
                '<span class="legend_square ip_square_dhcp_set"></span>' +
                '<span class="legend_text" i18n="iplegend.dhcp.label"></span>' +
                '<p class="legend_count_p"><span>(</span><span class="legend_count">0</span><span>)</span></p></li>' +
            '<li class="square_dhcp">' +
                '<span class="legend_square ip_square_gateway_legend"></span>' +
                '<span class="legend_text legend_text_gateway" i18n="iplegend.gateway.label"></span>' +
                '<p class="legend_count_p"><span>(</span><span class="legend_count">0</span><span>)</span></p>' +
            '</li>' +
            '</ul>');
        this.draw();
        return this;
    }
    IPLegend.prototype.draw=function()
    {
        this.box.empty();
        this.box.append(this.contatiner);
        ef.i18n.parse(this.contatiner);
        if(this.data)this.setData(this.data);
    };
    IPLegend.prototype.setData=function(data)
    {
        if(!_.isObject(data))
        {
            return false;
        }
        this.data=data;
        this.contatiner.find(".square_unselect .legend_count").text(data.unselect);
        this.contatiner.find(".square_selected .legend_count").text(data.selected);
        this.contatiner.find(".square_occupy_host .legend_count").text(data.hostOccupy);
        this.contatiner.find(".square_occupy .legend_count").text(data.tenantOccupy);
        this.contatiner.find(".square_dhcp .legend_count").text(data.gateway);
        this.contatiner.find(".square_dhcp_edit .legend_count").text(data.dhcp);
        return true;
    };
    IPLegend.isDom=true;
    ef.register(IPLegend,"ipLegend");
    return IPLegend;
});