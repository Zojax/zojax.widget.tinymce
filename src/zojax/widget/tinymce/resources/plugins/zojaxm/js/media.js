tinyMCEPopup.requireLangPack();

var ZojaxDialog = {
	addKeyboardNavigation: function(){
		var tableElm, cells, settings;
			
		cells = tinyMCEPopup.dom.select("a.emoticon_link", "emoticon_table");
			
		settings ={
			root: "emoticon_table",
			items: cells
		};
		cells[0].tabindex=0;
		tinyMCEPopup.dom.addClass(cells[0], "mceFocus");
		if (tinymce.isGecko) {
			cells[0].focus();		
		} else {
			setTimeout(function(){
				cells[0].focus();
			}, 100);
		}
		tinyMCEPopup.editor.windowManager.createInstance('tinymce.ui.KeyboardNavigation', settings, tinyMCEPopup.dom);

	}, 
	init : function(ed) {
		tinyMCEPopup.resizeToInnerSize();

        var editor = tinyMCE.activeEditor;
        var jquery = editor.getWin().parent.jQuery;

        k = tinyMCEPopup.dom.get('images_content');

        jquery(k).html(tinyMCE.activeEditor.getParam('url2'));

//        limit	30
//        ph	80
//        pw	80
//        start	0

//        http://127.0.0.1:8080/QuickIntranet/@@content.attachments/90227943/imageManagerAPI/"

        jquery.post(tinyMCE.activeEditor.getParam('url2')+'listing', {limit:30, ph:80, pw:80, start:0}, function(data) {
            console.log(data);
        });
    },

	insert : function(file, title) {
		var ed = tinyMCEPopup.editor, dom = ed.dom;

		tinyMCEPopup.execCommand('mceInsertContent', false, dom.createHTML('img', {
			src : tinyMCEPopup.getWindowArg('plugin_url') + '/img/' + file,
			alt : ed.getLang(title),
			title : ed.getLang(title),
			border : 0
		}));

		tinyMCEPopup.close();
	}
};

tinyMCEPopup.onInit.add(ZojaxDialog.init, ZojaxDialog);
