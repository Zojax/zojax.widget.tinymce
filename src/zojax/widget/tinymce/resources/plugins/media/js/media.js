String.prototype.capitalize = function () {
    return this.replace(/^./, function (char) {
        return char.toUpperCase();
    });
};
(function() {
	var url;
    var $ = tinyMCE.activeEditor.getWin().parent.jQuery;

	if (url = tinyMCEPopup.getParam("media_external_list_url"))
		document.write('<script language="javascript" type="text/javascript" src="' + tinyMCEPopup.editor.documentBaseURI.toAbsolute(url) + '"></script>');

	function get(id) {
		return document.getElementById(id);
	}

	function clone(obj) {
		var i, len, copy, attr;

		if (null == obj || "object" != typeof obj)
			return obj;

		// Handle Array
		if ('length' in obj) {
			copy = [];

			for (i = 0, len = obj.length; i < len; ++i) {
				copy[i] = clone(obj[i]);
			}

			return copy;
		}

		// Handle Object
		copy = {};
		for (attr in obj) {
			if (obj.hasOwnProperty(attr))
				copy[attr] = clone(obj[attr]);
		}

		return copy;
	}

	function getVal(id) {
		var elm = get(id);

		if (elm.nodeName == "SELECT")
			return elm.options[elm.selectedIndex].value;

		if (elm.type == "checkbox")
			return elm.checked;

		return elm.value;
	}

	function setVal(id, value, name) {
		if (typeof(value) != 'undefined' && value != null) {
			var elm = get(id);

			if (elm.nodeName == "SELECT")
				selectByValue(document.forms[0], id, value);
			else if (elm.type == "checkbox") {
				if (typeof(value) == 'string') {
					value = value.toLowerCase();
					value = (!name && value === 'true') || (name && value === name.toLowerCase());
				}
				elm.checked = !!value;
			} else
				elm.value = value;
		}
	}

	window.Media = {
        api_url: tinyMCE.activeEditor.getParam('mediaUrl2'),
        current_tab: 'my',
        pageSize: 30,
        page: 1,
        pages_count: 1,

		init : function() {
			var html, editor, self = this;

			self.editor = editor = tinyMCEPopup.editor;

			// Setup file browsers and color pickers
			get('filebrowsercontainer').innerHTML = getBrowserHTML('filebrowser','src','media','media');
			get('qtsrcfilebrowsercontainer').innerHTML = getBrowserHTML('qtsrcfilebrowser','quicktime_qtsrc','media','media');
			get('bgcolor_pickcontainer').innerHTML = getColorPickerHTML('bgcolor_pick','bgcolor');
			get('video_altsource1_filebrowser').innerHTML = getBrowserHTML('video_filebrowser_altsource1','video_altsource1','media','media');
			get('video_altsource2_filebrowser').innerHTML = getBrowserHTML('video_filebrowser_altsource2','video_altsource2','media','media');
			get('audio_altsource1_filebrowser').innerHTML = getBrowserHTML('audio_filebrowser_altsource1','audio_altsource1','media','media');
			get('audio_altsource2_filebrowser').innerHTML = getBrowserHTML('audio_filebrowser_altsource2','audio_altsource2','media','media');
			get('video_poster_filebrowser').innerHTML = getBrowserHTML('filebrowser_poster','video_poster','image','media');

			html = self.getMediaListHTML('medialist', 'src', 'media', 'media');
			if (html == "")
				get("linklistrow").style.display = 'none';
			else
				get("linklistcontainer").innerHTML = html;

			if (isVisible('filebrowser'))
				get('src').style.width = '230px';

			if (isVisible('video_filebrowser_altsource1'))
				get('video_altsource1').style.width = '220px';

			if (isVisible('video_filebrowser_altsource2'))
				get('video_altsource2').style.width = '220px';

			if (isVisible('audio_filebrowser_altsource1'))
				get('audio_altsource1').style.width = '220px';

			if (isVisible('audio_filebrowser_altsource2'))
				get('audio_altsource2').style.width = '220px';

			if (isVisible('filebrowser_poster'))
				get('video_poster').style.width = '220px';

			editor.dom.setOuterHTML(get('media_type'), self.getMediaTypeHTML(editor));

			self.setDefaultDialogSettings(editor);
			self.data = clone(tinyMCEPopup.getWindowArg('data'));
			self.dataToForm();
			self.preview();
			updateColor('bgcolor_pick', 'bgcolor');
            if (tinyMCE.activeEditor.getParam('mediaUrl1')) {
                $(document.getElementById('document_media_tab')).show();
                self.loadDocumentMedia();
            }
            self.loadMyMedia();
            self.loadYoutubeMedia();
            self.loadWistiaMedia();

            console.log(tinyMCE.activeEditor.getParam('imageMaxWidth'))
            console.log(tinyMCE.activeEditor.getParam('imageMaxHeight'))
            console.log(tinyMCE.activeEditor.getParam('wistiaApiUsername'))
            console.log(tinyMCE.activeEditor.getParam('wistiaApiPassword'))
            console.log(tinyMCE.activeEditor.getParam('wistiaApiProxyUrl'))
            self.mce_imageMaxHeight = configlet.imageMaxHeight
            self.mce_wistiaApiUsername = configlet.wistiaApiUsername
            self.mce_wistiaApiPassword = configlet.wistiaApiPassword
            self.mce_wistiaApiProxyUrl = configlet.wistiaApiProxyUrl


		},

        loadYoutubeMedia : function (q) {
            var youtubeAPI = "https://gdata.youtube.com/feeds/api/videos?v=2";
            $.ajax({
                url: youtubeAPI,

                data: {
                    alt: 'jsonc',
                    "max-results": '30',
                    q: q || ''
                },
                success: function( data ) {
                    var container = document.getElementById('youtube_media_container');
                    container.innerHTML = '';
                    window.Media.youtube_media_data = data.data.items;
                    $.each( data.data.items, function( i, item ) {
                        for (var key in item.content){content = item.content[key]; break;}
                        $(container).append('' +
                            '<div onclick="javascript:window.Media.select(this);" class="img-container" data-content-url="'+content+'" data-index="'+i+'" data-source="youtube">' +
                                '<div class="wraper" id="'+item.id+'">' +
                                    '<img src="'+item.thumbnail.sqDefault+'">' +
                                    '<span>'+item.title+'</span>' +
                                '</div>' +
                            '</div>');
                    });
                }
            });
        },

        loadWistiaMedia : function (order) {
            var wistiaAPI = "/WistiaJsAPI/";
            $.ajax({
                url: wistiaAPI,
                data: {
                    alt: 'jsonc',
                    sort:order,
                    limit: this.pageSize,
                    start: (this.page -1) * this.pageSize
//                        q: 'filter'
                },
                success: function( data ) {
                    if (data.length == 0) {
                        window.Media.page -= 1;
                        document.getElementById('wistia_current_page').value = window.Media.page;
                        return;
                    }
                    var container = document.getElementById('wistia_media_container');
                    container.innerHTML = '';
                    window.Media.my_media_data = data.medias;
//                    window.Media.pages_count = Math.ceil(data.total/window.Media.pageSize);
//                    if (window.Media.pages_count > 1) {
                        $(document.getElementById('wistia_paginator')).show();
//                        document.getElementById('wistia_total_pages').innerHTML = window.Media.pages_count;
//                    }
                    window.Media.wistia_media_data = data;
                    $.each( data, function( i, item ) {
                        $(container).append('' +
                            '<div onclick="javascript:window.Media.select(this);" class="img-container" data-index="'+i+'" data-source="wistia">' +
                                '<div class="wraper" id="'+item.id+'">' +
                                    '<img src="'+item.thumbnail.url+'">' +
                                    '<span>'+item.name+'</span>' +
                                '</div>' +
                            '</div>');
                    });
                }
            });
        },
        loadMyMedia : function (order) {
            var urlAPI = tinyMCE.activeEditor.getParam('mediaUrl2');
            if(!order) order = "modified";

            var params = {
                ph:80,
                pw:80,
                sort:order,
                limit: this.pageSize,
                start: (this.page -1) * this.pageSize
            };

            $.ajax({
                url: urlAPI + 'listing/',
                type: "post",
                data: params,
                success: function( data ) {
                    var container = document.getElementById('my_media_container');
                    window.Media.my_media_data = data.medias;
                    window.Media.pages_count = Math.ceil(data.total/window.Media.pageSize);
                    if (window.Media.pages_count > 1) {
                        $(document.getElementById('my_paginator')).show();
                        document.getElementById('my_total_pages').innerHTML = window.Media.pages_count;
                    }
                    $(container).html('');
                    $.each( data.medias, function( i, item ) {
                        $(container).append('' +
                            '<div class="img-container" data-index="'+i+'" data-source="my">' +
                                '<div class="wraper" id="'+item.id+'">' +
                                    '<span title="Delete Image" class="z_delete" id="'+ item.name+'" onclick="javascript:window.Media.removeMedia(this);">x</span>' +
                                    '<img onclick="javascript:window.Media.select(this);" src="'+item.preview+'">' +
                                    '<span>'+item.title+'</span>' +
                                '</div>' +
                            '</div>');
                    });
                }
            });
        },
        loadDocumentMedia : function (order) {
            var urlAPI = tinyMCE.activeEditor.getParam('mediaUrl1');
            if(!order) order = "modified";

            var params = {
                ph:80,
                pw:80,
                sort:order,
                limit: this.pageSize,
                start: (this.page -1) * this.pageSize
            };


            $.ajax({
                url: urlAPI + 'listing/',
                type: "post",
                data: params,
                success: function( data ) {
                    var container = document.getElementById('document_media_container');
                    window.Media.document_media_data = data.medias;
                    window.Media.pages_count = Math.ceil(data.total/window.Media.pageSize);
                    if (window.Media.pages_count > 1) {
                        $(document.getElementById('document_paginator')).show();
                        document.getElementById('document_total_pages').innerHTML = window.Media.pages_count;
                    }
                    $(container).html('');
                    $.each( data.medias, function( i, item ) {
                        $(container).append('' +
                            '<div onclick="javascript:window.Media.select(this);" class="img-container" data-index="'+i+'" data-source="document">' +
                                '<div class="wraper" id="'+item.id+'">' +
                                    '<span title="Delete Image" class="z_delete" id="'+ item.name+'" onclick="javascript:window.Media.removeMedia(this);">x</span>' +
                                    '<img src="'+item.preview+'">' +
                                    '<span>'+item.title+'</span>' +
                                '</div>' +
                            '</div>');
                    });
                }
            });
        },

        removeMedia: function(image) {

            tinyMCEPopup.confirm(tinyMCEPopup.getLang('advimage_dlg.remove')+image.id +"?", function(s) {
                if (s){
                    var x = new XMLHttpRequest();
                    x.onreadystatechange = function() {
                        if (x.readyState === x.DONE) {
                            window.Media.loadCurrentTab();
                        }
                    };
                    x.open('POST', window.Media.api_url+'remove');
                    x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                    x.send('media='+image.id);
                }
            })
        },


        filterMedaiaData: function(filter){
            var data = window.Media.getCurrentData();
            var container = document.getElementById(window.Media.current_tab+'_media_container');
            $(container).html('');
            $.each( data, function( i, item ) {
                var preview = item.preview || item.thumbnail.url || item.thumbnail.sqDefault;
                var title = item.title || item.name;
                if(!filter || filter.trim()=='' || title.toUpperCase().indexOf(filter.toUpperCase()) != -1 ) {
                    $(container).append('' +
                        '<div onclick="javascript:window.Media.select(this);" class="img-container" data-index="'+i+'" data-source="'+window.Media.current_tab+'">' +
                            '<div class="wraper" id="'+item.id+'">' +
                                '<img src="'+preview+'">' +
                                '<span>'+title+'</span>' +
                            '</div>' +
                        '</div>');
                }
            });

        },

        getCurrentData: function (){return window.Media[window.Media.current_tab+'_media_data']},

        order: function(o) {this.loadCurrentTab(o);},

        loadCurrentTab: function(order){return this['load'+this.current_tab.capitalize()+'Media'](order);},

        changeImageTab: function (tab) {
            window.Media.current_tab = tab;
            if (tab == 'document') {
                window.Media.api_url = tinyMCE.activeEditor.getParam('mediaUrl1');
                window.Media.loadDocumentMedia();
            } else {
                window.Media.api_url = tinyMCE.activeEditor.getParam('mediaUrl2');
                window.Media.loadMyMedia();
            };
            var from_time = document.getElementById('from_time_cont');
            tab == 'wistia' ? $(from_time).css('display','inline') : $(from_time).hide();
//            tab == 'wistia' ? $(from_time).show() : $(from_time).hide();
//            window.Media.page = 1;
//            window.Media.loadData();
        },

        reloadLocalMediaTabs: function(){
            window.Media.loadMyMedia();
            window.Media.loadDocumentMedia();
        },

        upload: function() {
            var p_url = tinyMCEPopup.getWindowArg('plugin_url');
            tinyMCE.activeEditor.windowManager.open({
                title: 'Upload media',
                file: p_url+'/add_metadata.htm',
                width : 320,
                height : 240,
                inline : 1
            },{
                api_url: window.Media.api_url,
                callback: function (data) {
                    window.Media.reloadLocalMediaTabs();
                }
            });

        },

        select: function(div){
            $(document.getElementsByClassName('img-container')).removeClass('selected');
            $(div).addClass('selected');
            window.Media.data_source = $(div).attr('data-source');
            window.Media.current_video = window.Media[window.Media.data_source+'_media_data'][$(div).attr('data-index')]
        },

		insert : function() {
			var editor = tinyMCEPopup.editor;
            if (window.Media.current_video){
                switch (window.Media.data_source) {
                    case 'my':
                    case 'document':
                        var video = window.Media.current_video;
                        var config = {
                            width: $(document.getElementById('width')).val() || 320,
                            height: $(document.getElementById('height')).val() || 240,
                            url: video.url,
                            preview: video.preview,
                            autoplay: $(document.getElementById('flash_play')).is(':checked'),
                            title: video.name,
                            duration: video.duration,
                            type: video.type
                        }
                        html = '' +
                            '<div>' +
                                '<div class="inline-thumb-wrap">' +
                                    '<div class="thumb">' +
                                        '<a href="'+config.url+'" class="z-media {' +
                                                                                    'width:\''+ config.width+'\','+
                                                                                    'height:\''+ config.height+'\','+
                                                                                    'type:\''+ config.type+'\','+
                                                                                    'preview: \''+ config.preview+ '\','+
                                                                                    'autoplay: '+config.autoplay+', params:{allowfullscreen: true}, ' +
                                                                                    'flashvars: { '+
                                                                                            'type: \''+ config.type+ '\', '+
                                                                                            'config: {clip: {\'url\':\''+config.url+'\',' +
                                                                                                                      ' \'autoPlay\':' + config.autoplay+ ', ' +
                                                                                                                      '\'autoBuffering\': true } },'+
                                                                                      'autostart: '+config.autoplay+' }}">'+
                                            '<img alt="'+config.title+'" src="'+ config.preview+ '">' +
                                        '</a>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                            '<br>'
                        break;
                    case 'wistia':
                        var video = window.Media.current_video;
                        var config = {
                            width: $(document.getElementById('width')).val() || 640,
                            height: $(document.getElementById('height')).val() || 480,
                            url: video.assets[1].url,
                            stil_url: video.assets[3].url,
                            preview: video.thumbnail.url,
                            autoplay: $(document.getElementById('flash_play')).is(':checked'),
                            title: video.name,
                            duration: video.duration,
                            id: video.hashed_id
                        };
                        from_time_e = document.getElementById('from_time');
                        time_e = $(from_time_e).val();
//                        intRegex = /^\d+$/;
//                        if (intRegex.test(time_e)) {
//                            time = time_e
//                        } else {
//                            time='0';
//                        }
                        time = hmsToSecondsOnly(time_e);
                        html = '' +
//                            '<div>' +
//                                '<div class="inline-thumb-wrap">' +
                                    '<div class="thumb">' +
                                        '<iframe '+
                                         'src="http://fast.wistia.net/embed/iframe/'+config.id+'?playerColor=ff0000&time='+time+
                                                    '&autoPlay='+config.autoplay+'&' +
                                                    'version=v1"' +
                                         'allowtransparency="true" ' +
                                         'frameborder="0" scrolling="no" ' +
                                         'class="wistia_embed" ' +
                                         'name="wistia_embed" ' +
                                         'width="'+config.width+'" ' +
                                         'height="' +config.height+ '" '+
                                         'style="background: url('+config.preview+'); background-size: 100% 100%;"> '+
                                        '</iframe>'+
                                    '</div>' +
//                                '</div>' +
//                            '</div>' +
                            '<br>';
//                            '<div>' +
//                                '<div class="inline-thumb-wrap">' +
//                                    '<div class="thumb" id="ttt">' +
//                                            '<img alt="'+config.title+'" src="'+ config.preview+ '">' +
//                            '<script src="http://fast.wistia.net/static/E-v1.js"></script>' +
//                            '<script>' +
//                            'Wistia.embed("qd4mt6xge4", {' +
//                            'playerColor: "ff0000",' +
//                            'fullscreenButton: false,'m +
//                            'container: "ttt",' +
//                            'autoPlay: true,' +
//                            'time: 30' +
//                            '});' +
//                            '</script>' +
//                                    '</div>' +
//                                '</div>' +
//                            '</div>' +
//                            '<br>';
//                        html = '' +
//                        '<div>' +
//                            '<div class="inline-thumb-wrap">' +
//                                '<div class="thumb">' +
//                                    '<a href="'+config.url+'" class="z-media {time: \'11\',' +
//                                                                    'width: \'640\','+
//                                                                    'height: \'480\','+
//                                                                    'type: \'wistia.video\','+
//                                                                    'preview: \''+ config.preview+ '\','+
//                                                                    'autoplay: '+ config.autoplay+ ', ' +
//                                                                    'params: { time: \'11\', allowfullscreen: true}, ' +
//                                                                    'flashvars:{ autoPlay: \'true\', '+
//                                                                        'stillUrl: \''+config.stil_url+'\', '+
//                                                                        'accountKey: \'wistia-production_12853\', '+
//                                                                        'mediaID: \'wistia-production_977641\', '+
//                                                                        'embedServiceURL: \'http://distillery.wistia.com/x\', '+
//                                                                        'mediaDuration: \''+config.duration+'\','+
//                                                                        'time : \'11\'' +
//                                                                    '} '+
//                                                                '}">' +
//                                        '<img alt="'+config.title+'" src="'+ config.preview+ '">' +
//                                    '</a>' +
//                                '</div>' +
//                            '</div>' +
////                            '<script>alert(1);</script>' +
//                        '</div>' +
//                        '<br>'
                        break;

                    case 'youtube':
                        var video = window.Media.current_video;
                        var config = {
                            width: $(document.getElementById('width')).val() || 320,
                            height: $(document.getElementById('height')).val() || 240,
                            url: video.id,
                            preview: "http://img.youtube.com/vi/"+video.id+"/default.jpg",
                            autoplay: $(document.getElementById('flash_play')).is(':checked'),
                            title: video.title
                        }
                        var html = '' +
                            '<div>'+
                            '<div class="inline-thumb-wrap">'+
                            '<div class="thumb">'+
                            '<a href="'+config.url+'" class="z-media {width: \'600\', ' +
                            'height: \'400\', ' +
                            'type: \'youtube\', ' +
                            'preview: \''+ config.preview+ '\', ' +
                            'autoplay: '+ config.autoplay+ ', ' +
                            'params:{allowfullscreen: true}, ' +
                            'flashvars: {type: \'youtube\', ' +
                                        'config: {\'clip\': {\'url\':\''+config.url+'\', ' +
                                                            '\'autoPlay\': '+config.autoplay+', ' +
                                                            '\'autoBuffering\': true } }, ' +
                                    'autostart: \''+config.autoplay+'\'}}">'+
                            '<img alt="'+config.title+'" src="'+ config.preview+ '">'+
                            '</a>'+
                            '</div>'+
                            '</div>'+
                            '</div>'+
                            '<br>'
                        break;

                }
                editor.execCommand('mceRepaint');
                editor.execCommand('mceInsertContent', false, html);



            } else {
                this.formToData();
                editor.execCommand('mceRepaint');
                tinyMCEPopup.restoreSelection();
                editor.selection.setNode(editor.plugins.media.dataToImg(this.data));
            }

			tinyMCEPopup.close();
		},

		preview : function() {
			get('prev').innerHTML = this.editor.plugins.media.dataToHtml(this.data, true);
		},

		moveStates : function(to_form, field) {
			var data = this.data, editor = this.editor,
				mediaPlugin = editor.plugins.media, ext, src, typeInfo, defaultStates, src;

			defaultStates = {
				// QuickTime
				quicktime_autoplay : true,
				quicktime_controller : true,

				// Flash
				flash_play : true,
				flash_loop : true,
				flash_menu : true,

				// WindowsMedia
				windowsmedia_autostart : true,
				windowsmedia_enablecontextmenu : true,
				windowsmedia_invokeurls : true,

				// RealMedia
				realmedia_autogotourl : true,
				realmedia_imagestatus : true
			};

			function parseQueryParams(str) {
				var out = {};

				if (str) {
					tinymce.each(str.split('&'), function(item) {
						var parts = item.split('=');

						out[unescape(parts[0])] = unescape(parts[1]);
					});
				}

				return out;
			};

			function setOptions(type, names) {
				var i, name, formItemName, value, list;

				if (type == data.type || type == 'global') {
					names = tinymce.explode(names);
					for (i = 0; i < names.length; i++) {
						name = names[i];
						formItemName = type == 'global' ? name : type + '_' + name;

						if (type == 'global')
						list = data;
					else if (type == 'video' || type == 'audio') {
							list = data.video.attrs;

							if (!list && !to_form)
							data.video.attrs = list = {};
						} else
						list = data.params;

						if (list) {
							if (to_form) {
								setVal(formItemName, list[name], type == 'video' || type == 'audio' ? name : '');
							} else {
								delete list[name];

								value = getVal(formItemName);
								if ((type == 'video' || type == 'audio') && value === true)
									value = name;

								if (defaultStates[formItemName]) {
									if (value !== defaultStates[formItemName]) {
										value = "" + value;
										list[name] = value;
									}
								} else if (value) {
									value = "" + value;
									list[name] = value;
								}
							}
						}
					}
				}
			}

			if (!to_form) {
				data.type = get('media_type').options[get('media_type').selectedIndex].value;
				data.width = getVal('width');
				data.height = getVal('height');

				// Switch type based on extension
				src = getVal('src');
				if (field == 'src') {
					ext = src.replace(/^.*\.([^.]+)$/, '$1');
					if (typeInfo = mediaPlugin.getType(ext))
						data.type = typeInfo.name.toLowerCase();

					setVal('media_type', data.type);
				}

				if (data.type == "video" || data.type == "audio") {
					if (!data.video.sources)
						data.video.sources = [];

					data.video.sources[0] = {src: getVal('src')};
				}
			}

			// Hide all fieldsets and show the one active
			get('video_options').style.display = 'none';
			get('audio_options').style.display = 'none';
			get('flash_options').style.display = 'none';
			get('quicktime_options').style.display = 'none';
			get('shockwave_options').style.display = 'none';
			get('windowsmedia_options').style.display = 'none';
			get('realmedia_options').style.display = 'none';
			get('embeddedaudio_options').style.display = 'none';

			if (get(data.type + '_options'))
				get(data.type + '_options').style.display = 'block';

			setVal('media_type', data.type);

			setOptions('flash', 'play,loop,menu,swliveconnect,quality,scale,salign,wmode,base,flashvars');
			setOptions('quicktime', 'loop,autoplay,cache,controller,correction,enablejavascript,kioskmode,autohref,playeveryframe,targetcache,scale,starttime,endtime,target,qtsrcchokespeed,volume,qtsrc');
			setOptions('shockwave', 'sound,progress,autostart,swliveconnect,swvolume,swstretchstyle,swstretchhalign,swstretchvalign');
			setOptions('windowsmedia', 'autostart,enabled,enablecontextmenu,fullscreen,invokeurls,mute,stretchtofit,windowlessvideo,balance,baseurl,captioningid,currentmarker,currentposition,defaultframe,playcount,rate,uimode,volume');
			setOptions('realmedia', 'autostart,loop,autogotourl,center,imagestatus,maintainaspect,nojava,prefetch,shuffle,console,controls,numloop,scriptcallbacks');
			setOptions('video', 'poster,autoplay,loop,muted,preload,controls');
			setOptions('audio', 'autoplay,loop,preload,controls');
			setOptions('embeddedaudio', 'autoplay,loop,controls');
			setOptions('global', 'id,name,vspace,hspace,bgcolor,align,width,height');

			if (to_form) {
				if (data.type == 'video') {
					if (data.video.sources[0])
						setVal('src', data.video.sources[0].src);

					src = data.video.sources[1];
					if (src)
						setVal('video_altsource1', src.src);

					src = data.video.sources[2];
					if (src)
						setVal('video_altsource2', src.src);
                } else if (data.type == 'audio') {
                    if (data.video.sources[0])
                        setVal('src', data.video.sources[0].src);
                    
                    src = data.video.sources[1];
                    if (src)
                        setVal('audio_altsource1', src.src);
                    
                    src = data.video.sources[2];
                    if (src)
                        setVal('audio_altsource2', src.src);
				} else {
					// Check flash vars
					if (data.type == 'flash') {
						tinymce.each(editor.getParam('flash_video_player_flashvars', {url : '$url', poster : '$poster'}), function(value, name) {
							if (value == '$url')
								data.params.src = parseQueryParams(data.params.flashvars)[name] || data.params.src || '';
						});
					}

					setVal('src', data.params.src);
				}
			} else {
				src = getVal("src");

				// YouTube Embed
				if (src.match(/youtube\.com\/embed\/\w+/)) {
					data.width = 425;
					data.height = 350;
					data.params.frameborder = '0';
					data.type = 'iframe';
					setVal('src', src);
					setVal('media_type', data.type);
				} else {
					// YouTube *NEW*
					if (src.match(/youtu\.be\/[a-z1-9.-_]+/)) {
						data.width = 425;
						data.height = 350;
						data.params.frameborder = '0';
						data.type = 'iframe';
						src = 'http://www.youtube.com/embed/' + src.match(/youtu.be\/([a-z1-9.-_]+)/)[1];
						setVal('src', src);
						setVal('media_type', data.type);
					}

					// YouTube
					if (src.match(/youtube\.com(.+)v=([^&]+)/)) {
						data.width = 425;
						data.height = 350;
						data.params.frameborder = '0';
						data.type = 'iframe';
						src = 'http://www.youtube.com/embed/' + src.match(/v=([^&]+)/)[1];
						setVal('src', src);
						setVal('media_type', data.type);
					}
				}

				// Google video
				if (src.match(/video\.google\.com(.+)docid=([^&]+)/)) {
					data.width = 425;
					data.height = 326;
					data.type = 'flash';
					src = 'http://video.google.com/googleplayer.swf?docId=' + src.match(/docid=([^&]+)/)[1] + '&hl=en';
					setVal('src', src);
					setVal('media_type', data.type);
				}
				
				// Vimeo
				if (src.match(/vimeo\.com\/([0-9]+)/)) {
					data.width = 425;
					data.height = 350;
					data.params.frameborder = '0';
					data.type = 'iframe';
					src = 'http://player.vimeo.com/video/' + src.match(/vimeo.com\/([0-9]+)/)[1];
					setVal('src', src);
					setVal('media_type', data.type);
				}
            
				// stream.cz
				if (src.match(/stream\.cz\/((?!object).)*\/([0-9]+)/)) {
					data.width = 425;
					data.height = 350;
					data.params.frameborder = '0';
					data.type = 'iframe';
					src = 'http://www.stream.cz/object/' + src.match(/stream.cz\/[^/]+\/([0-9]+)/)[1];
					setVal('src', src);
					setVal('media_type', data.type);
				}
				
				// Google maps
				if (src.match(/maps\.google\.([a-z]{2,3})\/maps\/(.+)msid=(.+)/)) {
					data.width = 425;
					data.height = 350;
					data.params.frameborder = '0';
					data.type = 'iframe';
					src = 'http://maps.google.com/maps/ms?msid=' + src.match(/msid=(.+)/)[1] + "&output=embed";
					setVal('src', src);
					setVal('media_type', data.type);
				}

				if (data.type == 'video') {
					if (!data.video.sources)
						data.video.sources = [];

					data.video.sources[0] = {src : src};

					src = getVal("video_altsource1");
					if (src)
						data.video.sources[1] = {src : src};

					src = getVal("video_altsource2");
					if (src)
						data.video.sources[2] = {src : src};
                } else if (data.type == 'audio') {
                    if (!data.video.sources)
                        data.video.sources = [];
                    
                    data.video.sources[0] = {src : src};
                    
                    src = getVal("audio_altsource1");
                    if (src)
                        data.video.sources[1] = {src : src};
                    
                    src = getVal("audio_altsource2");
                    if (src)
                        data.video.sources[2] = {src : src};
				} else
					data.params.src = src;

				// Set default size
                setVal('width', data.width || (data.type == 'audio' ? 300 : 320));
                setVal('height', data.height || (data.type == 'audio' ? 32 : 240));
			}
		},

		dataToForm : function() {
			this.moveStates(true);
		},

		formToData : function(field) {
			if (field == "width" || field == "height")
				this.changeSize(field);

			if (field == 'source') {
				this.moveStates(false, field);
				setVal('source', this.editor.plugins.media.dataToHtml(this.data));
				this.panel = 'source';
			} else {
				if (this.panel == 'source') {
					this.data = clone(this.editor.plugins.media.htmlToData(getVal('source')));
					this.dataToForm();
					this.panel = '';
				}

				this.moveStates(false, field);
				this.preview();
			}
		},

		beforeResize : function() {
            this.width = parseInt(getVal('width') || (this.data.type == 'audio' ? "300" : "320"), 10);
            this.height = parseInt(getVal('height') || (this.data.type == 'audio' ? "32" : "240"), 10);
		},

		changeSize : function(type) {
			var width, height, scale, size;

			if (get('constrain').checked) {
                width = parseInt(getVal('width') || (this.data.type == 'audio' ? "300" : "320"), 10);
                height = parseInt(getVal('height') || (this.data.type == 'audio' ? "32" : "240"), 10);

				if (type == 'width') {
					this.height = Math.round((width / this.width) * height);
					setVal('height', this.height);
				} else {
					this.width = Math.round((height / this.height) * width);
					setVal('width', this.width);
				}
			}
		},

		getMediaListHTML : function() {
			if (typeof(tinyMCEMediaList) != "undefined" && tinyMCEMediaList.length > 0) {
				var html = "";

				html += '<select id="linklist" name="linklist" style="width: 250px" onchange="this.form.src.value=this.options[this.selectedIndex].value;Media.formToData(\'src\');">';
				html += '<option value="">---</option>';

				for (var i=0; i<tinyMCEMediaList.length; i++)
					html += '<option value="' + tinyMCEMediaList[i][1] + '">' + tinyMCEMediaList[i][0] + '</option>';

				html += '</select>';

				return html;
			}

			return "";
		},

		getMediaTypeHTML : function(editor) {
			function option(media_type, element) {
				if (!editor.schema.getElementRule(element || media_type)) {
					return '';
				}

				return '<option value="'+media_type+'">'+tinyMCEPopup.editor.translate("media_dlg."+media_type)+'</option>'
			}

			var html = "";

			html += '<select id="media_type" name="media_type" onchange="Media.formToData(\'type\');">';
			html += option("video");
			html += option("audio");
			html += option("flash", "object");
			html += option("quicktime", "object");
			html += option("shockwave", "object");
			html += option("windowsmedia", "object");
			html += option("realmedia", "object");
			html += option("iframe");

			if (editor.getParam('media_embedded_audio', false)) {
				html += option('embeddedaudio', "object");
			}

			html += '</select>';
			return html;
		},

		setDefaultDialogSettings : function(editor) {
			var defaultDialogSettings = editor.getParam("media_dialog_defaults", {});
			tinymce.each(defaultDialogSettings, function(v, k) {
				setVal(k, v);
			});
        },

        nextPage: function () {
            if (this.page + 1 < this.pages_count || this.current_tab == 'wistia'){
                this.toPage(this.page + 1);
            }
            return false;
        },
        prevPage: function () {
            if (this.page - 1 >= 1){
                var page = this.page > 1 ? this.page-1: 1;
                this.toPage(page);
            }
            return false;
        },
        toPage: function (n) {
            var p = parseInt(n);
            if (!isNaN(p)){
                p = ((0 < p) && (p < this.pages_count)) || this.current_tab == 'wistia' ? p: this.pages_count;
                if (p != this.page) {
                    this.page = p;
                    this.loadCurrentTab();
                }
                document.getElementById(this.current_tab+'_current_page').value = p;
            } else {
                document.getElementById(this.current_tab+'_current_page').value = this.page;
            }
            return false;
        },
        lastPage: function () {
            this.toPage(this.pages_count);
            return false;
        },
        firstPage: function () {
            this.toPage(1);
            return false;
        }

	};

	tinyMCEPopup.requireLangPack();
	tinyMCEPopup.onInit.add(function() {
		Media.init();
	});
})();


function hide_time() {
    var $ = tinyMCE.activeEditor.getWin().parent.jQuery;
    var from_time = document.getElementById('from_time_cont');
    $(from_time).hide();
}

function hmsToSecondsOnly(str) {
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    if(isNaN(s)) return 0; else return s;
}
