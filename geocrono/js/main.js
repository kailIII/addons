/* 
 * Copyright (c) 2014 by GeoBolivia 
 * Author: Davis Mendoza Paco <davis.men.pa@gmail.com, dmendoza@geo.gob.bo> 
 *
 */
Ext.namespace("GEOR.Addons");

GEOR.Addons.GeoCrono = function(map, options) {
    this.map = map;
    this.options = options;
    this.control = null;
    this.item = null;
};

// If required, may extend or compose with Ext.util.Observable
GEOR.Addons.GeoCrono.prototype = {
    layersWms: null,
    wmsPanel: null,
    cbboxStart: null,
    cbboxEnd: null,
    
    /**
     * Method: init
     *
     * Parameters:
     * record - {Ext.data.record} a record with the addon parameters
     */
    init: function(record) {
		options=this.options;
        
        var lang = OpenLayers.Lang.getCode();
        this.item = new Ext.menu.Item({
            text: record.get("title")[lang],
            iconCls: 'icon',
            qtip: record.get("description")[lang],
            handler: this.showWindow,
            scope: this
        });
        var layers = [];
        cbboxStart = this.createComboBox('cbboxStart',OpenLayers.i18n('Start'), this.layers);
        cbboxEnd = this.createComboBox('cbboxEnd',OpenLayers.i18n('End'),this.layers)
        
        return this.item;
    },

    /**
     * Method: destroy
     * Called by GEOR_tools when deselecting this addon
     */
    destroy: function() {
        this.control && this.control.destroy();
        this.control = null;
        this.map = null;
    },
     
    showWindow: function(){
        if (!this.win) {
            this.win = new Ext.Window({
                title: OpenLayers.i18n('GeoCrono'),
                width: 750,
                height: 160,
                resizable: false,
                iconCls: 'icon',
                closeAction: 'hide',
                plain: true,
                layout:'border',
                items: [{
					region: 'north',
					height: 40,
					items: [this.createFormNorth()]
				},{
					region: 'center',
					items: [this.createFormCenter()]
				}]
            });
        }
        this.win.show();
    },
    
    /*****/
    createFormNorth: function() {
        var form = new Ext.FormPanel({
            labelAlign: 'left',
            width: '100%',
            frame: true,
            bodyStyle: 'padding:5px 5px 0',
            items: [{
                layout: 'column',
                items: [{
                    columnWidth: .5,
                    layout: 'form',
                    items: [cbboxStart]
                }, {
                    columnWidth: .5,
                    layout: 'form',
                    items: [cbboxEnd]
                }]
            }]
        });
        return form;
    },
    
    createComboBox: function(id, field, store){
        var combo = new Ext.form.ComboBox({
            id: id,
            store: new Ext.data.ArrayStore({
                fields: ['abbr','layer'],
                data : store 
            }),
            displayField:'layer',
            editable:false,
            mode: 'local',
            triggerAction: 'all',
            fieldLabel: field,
            emptyText: OpenLayers.i18n('Select a layer'),  
            width: 200,
            onSelect: function(record) {
            }
        });
        return combo;
    },
    
    /*****/
    
    createFormCenter: function() {
        var form = new Ext.FormPanel({
            labelAlign: 'left',
            width: '100%',
            frame: true,
            bodyStyle: 'padding:5px 5px 0',
            items: []
        });
        this.getLayersWms(form, this);
        return form;
    },
    
    getLayersWms: function(form, comp){
		var mm = comp;
		GEOR.waiter.show();
		var url=this.options.urlWmsCapabilities;
		var request = OpenLayers.Request.GET({
			url: url,
			params: {
				SERVICE: "WMS",
				VERSION: "1.3.0",
				REQUEST: "GetCapabilities"
			},
			success: function(request){				
				var rbItems = [];
				var format = new OpenLayers.Format.WMSCapabilities({
					version: "1.3.0"
				});
				var doc = request.responseXML;
				if (!doc || !doc.documentElement) {
					doc = request.responseText;
				}
				var capabilities = format.read(doc);
				var layers = capabilities.capability.layers;
				
				var url=mm.options.urlWmsCapabilities;				
				if(mm.layersWms == null){
					mm.layersWms = [];
				}
				//layers wms
				for(var i=0; i<layers.length; i++) {
					if(layers[i].name && layers[i].name!="") {
						var title = layers[i].title;
						var name = layers[i].name;
						rbItems.push({
							boxLabel: mm.subString(title, 7),
							inputValue: name
						});
						var layer = new OpenLayers.Layer.WMS(name, url, {
							singleTile: false,
							layers: name,
							transparent: true,
						},{
							displayInLayerSwitcher: false
						});
						mm.layersWms.push([layer.id, name, layer]);
					}
				}				
				
				var rbg = new Ext.form.RadioGroup({
					columns: 6,
					vertical: true,
					fieldLabel: OpenLayers.i18n('Day'),
					defaults: {xtype: "radio",name: "rb-horiz2"},
					items: [],
					listeners: {
						change: function(radiogroup, radio) {
							mm.changeRadioButton(radio);
						}
					}
				});
				
				rbg.items = rbItems;
				form.add(rbg);
				form.doLayout();
			},
			failure: function() {            
				GEOR.util.errorDialog({
                    msg: OpenLayers.i18n('Server unavailable')
                });
			}
		});
	},
	
	objToString: function (obj) {
		var str = '';
		for (var p in obj) {
			if (obj.hasOwnProperty(p)) {
				str += p + ':' + obj[p] + '\n';
			}
		}
		return str;
	},
	
	changeRadioButton: function(radio){
		for(var i=0; i< this.layersWms.length ; i++){
			var l = this.layersWms;
			var id = l[i][0];
			var name = l[i][1];
			var layer = l[i][2];
			
			if(radio.inputValue == name){
				var layerC = this.map.getLayer(id);
				if(layerC == null){
					this.map.addLayer(layer);
				} else {
					layerC.setVisibility(true);
				}
			}else{
				var layerC = this.map.getLayer(id);
				if(layerC != null){
					layerC.setVisibility(false);
				}
			}
        }
	},
	
	subString: function (str, n) {
		if(str.length > n)
			return str.substring(0, n);
		return str;
	}
};