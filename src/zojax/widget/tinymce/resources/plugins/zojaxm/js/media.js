tinyMCEPopup.requireLangPack();

function cl(d) {
    console.log(d)
}

var ZojaxDialog = {

    $: {},
    images: [],
    self: this,

    hideError: function() {
        $(tinyMCEPopup.dom.get('z_error')).text('');
    },

    formatData : function(data_all) {
        for(d in data_all) {

            data = data_all[d];

            data.label = (data.title.length > 15)
                ? data.name.substr(0, 12) + '...' : data.title;
            data.tip = "Name: " + data.title +
                ", Dimensions: " + data.width + " x " + data.height +
                ", Size: " + ((data.size < 1024) ? data.size + " bytes"
                : (Math.round(((data.size * 10) / 1024)) / 10) + " KB");
            if (data.width > data.height) {
                if (data.width < 80) {
                    data.thumbwidth = data.width;
                    data.thumbheight = data.height;
                } else {
                    data.thumbwidth = 80;
                    data.thumbheight = 80 / data.width * data.height;
                }
            } else {
                if (data.height < 80) {
                    data.thumbwidth = data.width;
                    data.thumbheight = data.height;
                } else {
                    data.thumbwidth = 80 / data.height * data.width;
                    data.thumbheight = 80;
                }
            }
        }
    },

    loadData: function(order) {
        if(!order) order = "modified";
        var params =  {ph:80, pw:80, sort:order};
        if(order=="title") params.dir = "asc";

        $(tinyMCEPopup.dom.get('z_wait')).show();

        $.post(tinyMCE.activeEditor.getParam('url2')+'listing', params, function(data) {
            ZojaxDialog.images = data.images;
            ZojaxDialog.formatData(ZojaxDialog.images);
            ZojaxDialog.redrawData()
            $(tinyMCEPopup.dom.get('z_wait')).hide();
        });
    },

    redrawData: function(filter) {

        k = tinyMCEPopup.dom.get('images_content');
        $(k).html('');
        for(i in ZojaxDialog.images) {

            m = ZojaxDialog.images[i];

            if(!filter || filter.trim()=='' || m.title.toUpperCase().indexOf(filter.toUpperCase()) != -1 ) {
                $(k).append(
                        $('<div class="z_imz_o">' +
                            '<span title="Delete Image" class="z_delete" id="zojaxd'+i+'">x</span>' +
                            '<div style=""><img style="margin-top:'+(40-ZojaxDialog.images[i].thumbheight/2)+'px;" id="zojaxm'+i+'" src="'+ZojaxDialog.images[i].preview+'"' +
                            'title="'+m.tip+'Kb" /></div>' +
                            '<div class="z_title">'+ZojaxDialog.images[i].label+'</div>'+
                           '</div>'
                        ));

                document.getElementById('zojaxm'+i).onclick = (function(i){
                        return function(){ ZojaxDialog.insert(ZojaxDialog.images[i]); }
                    })(i);
                document.getElementById('zojaxd'+i).onclick = (function(i){
                        return function(){ ZojaxDialog.remove(ZojaxDialog.images[i]); }
                    })(i);
            }
        }
    },

	init: function(ed) {
        var bname = document.getElementById("zuploadf");
        bname.name = 'xxx';
		tinyMCEPopup.resizeToInnerSize();
        editor = tinyMCE.activeEditor;
        $ = editor.getWin().parent.jQuery;
        $(tinyMCEPopup.dom.get('z_error'))
        this.activateImages();
        this.loadData();
    },

    activateImages: function() {
        $(tinyMCEPopup.dom.get('z_nav')).find('.z_tab').removeClass('selected');
        $(tinyMCEPopup.dom.get('z_images')).addClass('selected');
    },

    order: function(sel) {
        this.loadData($(sel).val());
    },

    success : function (d) {
        $(tinyMCEPopup.dom.get('z_wait')).hide();
        d = $(d).text().replace('<pre>', '');
        d = d.replace('</pre>', '');
        data = $.parseJSON(d);
        if(!data.success) {
            $(tinyMCEPopup.dom.get('z_error')).html(data.error);
            setTimeout(ZojaxDialog.hideError, 3000);
        } else {
            ZojaxDialog.loadData();
        }
    },

    upload: function(form) {
        $(tinyMCEPopup.dom.get('z_wait')).show();
        fileUpload(form, ZojaxDialog.success);
    },

    remove: function(image) {
       if(confirm("Delete image "+image.title)) {
            $(tinyMCEPopup.dom.get('z_wait')).show();
            $.post(tinyMCE.activeEditor.getParam('url2')+'remove', {image: image.title}, function(data) {
                ZojaxDialog.loadData();
                $(tinyMCEPopup.dom.get('z_wait')).hide();
            });
       }
    },

	insert : function(image) {
		var ed = tinyMCEPopup.editor, dom = ed.dom;
		tinyMCEPopup.execCommand('mceInsertContent', false, dom.createHTML('img', {
			src : tinyMCEPopup.getWindowArg('plugin_url') + '/img/' + image.url
		}));
	tinyMCEPopup.close();
	}
};

tinyMCEPopup.onInit.add(ZojaxDialog.init, ZojaxDialog);

function fileUpload(form, success) {

    action_url = tinyMCE.activeEditor.getParam('url2')+'upload';

    var iframe = document.createElement("iframe");
    iframe.setAttribute("id", "upload_iframe");
    iframe.setAttribute("name", "upload_iframe");
    iframe.setAttribute("width", "0");
    iframe.setAttribute("height", "0");
    iframe.setAttribute("border", "0");
    iframe.setAttribute("style", "width: 0; height: 0; border: none;");

    // Add to document...
    form.parentNode.appendChild(iframe);
    window.frames['upload_iframe'].name = "upload_iframe";

    iframeId = document.getElementById("upload_iframe");

    var eventHandler = function () {

        if (iframeId.detachEvent) iframeId.detachEvent("onload", eventHandler);
        else iframeId.removeEventListener("load", eventHandler, false);

        if (iframeId.contentDocument) {
            content = iframeId.contentDocument.body.innerHTML;
        } else if (iframeId.contentWindow) {
            content = iframeId.contentWindow.document.body.innerHTML;
        } else if (iframeId.document) {
            content = iframeId.document.body.innerHTML;
        }

        success(content);

        setTimeout('iframeId.parentNode.removeChild(iframeId)', 250);
    }

    if (iframeId.addEventListener) iframeId.addEventListener("load", eventHandler, true);
    if (iframeId.attachEvent) iframeId.attachEvent("onload", eventHandler);

    form.setAttribute("target", "upload_iframe");
    form.setAttribute("action", action_url);
    form.setAttribute("method", "post");
    form.setAttribute("enctype", "multipart/form-data");
    form.setAttribute("encoding", "multipart/form-data");

    form.submit();
}
