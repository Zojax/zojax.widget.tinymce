var ImageDialog = {
    current_tab: 'my',
    current_image: {},
    images: {},
    my_images: {},
    document_images: {},
    api_url: tinyMCE.activeEditor.getParam('url2'),
    imageMaxWidth: 480,
    imageMaxHeight: 360,
    pageSize: 30,
    page: 1,
    pages_count: 1,

	preInit : function() {
		var url;

		tinyMCEPopup.requireLangPack();

		if (url = tinyMCEPopup.getParam("external_image_list_url"))
			document.write('<script language="javascript" type="text/javascript" src="' + tinyMCEPopup.editor.documentBaseURI.toAbsolute(url) + '"></script>');
	},

	init : function(ed) {
		var f = document.forms[0], nl = f.elements, ed = tinyMCEPopup.editor, dom = ed.dom, n = ed.selection.getNode(), fl = tinyMCEPopup.getParam('external_image_list', 'tinyMCEImageList');

		tinyMCEPopup.resizeToInnerSize();
		this.fillClassList('class_list');
		this.fillFileList('src_list', fl);
		this.fillFileList('over_list', fl);
		this.fillFileList('out_list', fl);
		TinyMCE_EditableSelects.init();

		if (n.nodeName == 'IMG') {
            var dimensions = this.dimensionsFromSrc(nl.src.value)
			nl.src.value = dom.getAttrib(n, 'src');
			nl.width.value = (dimensions != null) && (dimensions.length >= 3) ? dimensions[1] : dom.getAttrib(n, 'width');
			nl.height.value = (dimensions != null) && (dimensions.length >= 3) ? dimensions[2] : dom.getAttrib(n, 'height');
			nl.alt.value = dom.getAttrib(n, 'alt');
			nl.title.value = dom.getAttrib(n, 'title');
			nl.vspace.value = this.getAttrib(n, 'vspace');
			nl.hspace.value = this.getAttrib(n, 'hspace');
			nl.border.value = this.getAttrib(n, 'border');
			selectByValue(f, 'align', this.getAttrib(n, 'align'));
			selectByValue(f, 'class_list', dom.getAttrib(n, 'class'), true, true);
			nl.style.value = dom.getAttrib(n, 'style');
			nl.id.value = dom.getAttrib(n, 'id');
			nl.dir.value = dom.getAttrib(n, 'dir');
			nl.lang.value = dom.getAttrib(n, 'lang');
			nl.usemap.value = dom.getAttrib(n, 'usemap');
			nl.longdesc.value = dom.getAttrib(n, 'longdesc');
			nl.insert.value = ed.getLang('update');
            ImageDialog.current_image.width = nl.width.value;
            ImageDialog.current_image.height = nl.height.value;

			if (/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/.test(dom.getAttrib(n, 'onmouseover')))
				nl.onmouseoversrc.value = dom.getAttrib(n, 'onmouseover').replace(/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/, '$1');

			if (/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/.test(dom.getAttrib(n, 'onmouseout')))
				nl.onmouseoutsrc.value = dom.getAttrib(n, 'onmouseout').replace(/^\s*this.src\s*=\s*\'([^\']+)\';?\s*$/, '$1');

			if (ed.settings.inline_styles) {
				// Move attribs to styles
				if (dom.getAttrib(n, 'align'))
					this.updateStyle('align');

				if (dom.getAttrib(n, 'hspace'))
					this.updateStyle('hspace');

				if (dom.getAttrib(n, 'border'))
					this.updateStyle('border');

				if (dom.getAttrib(n, 'vspace'))
					this.updateStyle('vspace');
			}
		}

		// Setup browse button
		document.getElementById('srcbrowsercontainer').innerHTML = getBrowserHTML('srcbrowser','src','image','theme_advanced_image');
		if (isVisible('srcbrowser'))
			document.getElementById('src').style.width = '260px';

		// Setup browse button
		document.getElementById('onmouseoversrccontainer').innerHTML = getBrowserHTML('overbrowser','onmouseoversrc','image','theme_advanced_image');
		if (isVisible('overbrowser'))
			document.getElementById('onmouseoversrc').style.width = '260px';

		// Setup browse button
		document.getElementById('onmouseoutsrccontainer').innerHTML = getBrowserHTML('outbrowser','onmouseoutsrc','image','theme_advanced_image');
		if (isVisible('outbrowser'))
			document.getElementById('onmouseoutsrc').style.width = '260px';

		// If option enabled default contrain proportions to checked
		if (ed.getParam("advimage_constrain_proportions", true))
			f.constrain.checked = true;

		// Check swap image if valid data
		if (nl.onmouseoversrc.value || nl.onmouseoutsrc.value)
			this.setSwapImage(true);
		else
			this.setSwapImage(false);

        if (tinyMCE.activeEditor.getParam('url1') != undefined) {
            document.getElementById('document_images_tab').style.display = 'block';
        }
		this.changeAppearance();
		this.showPreviewImage(nl.src.value, 1);
        this.loadData();
	},

    formatData : function(data_all) {
        for(var d in data_all) {

            if (isNaN(parseInt(d))) continue;
            var data = data_all[d];
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

    redrawData: function(filter, tab_id) {
        var tab = tinyMCEPopup.dom.get(tab_id);
        var images;
        images = ImageDialog.images;
        tab.innerHTML = '';
        for(var i in images) {
            if (isNaN(parseInt(i))) continue;
            var m = images[i];
            if(!filter || filter.trim()=='' || m.title.toUpperCase().indexOf(filter.toUpperCase()) != -1 ) {
                var k = document.createElement('div');
                k.className = 'z_imz_o'
                k.id = '_img'+ m.id;
                k.innerHTML +=
                            '<span title="Delete Image" class="z_delete" id="img-delete'+ m.id+'">x</span>' +
                            '<div style=""><img style="margin-top:'+(40-m.thumbheight/2)+'px;" src="'+m.preview+'"' +
                            'title="'+m.tip+'Kb" /></div>' +
                                '<div class="z_title">'+m.label+'</div>';
                tab.appendChild(k);
                document.getElementById('_img'+ m.id).onclick = (function(m){
                        return function(){ ImageDialog.activateImg(m); }
                    })(m);
                document.getElementById('img-delete'+ m.id).onclick = (function(i){
                        return function(){ ImageDialog.remove(images[i]); }
                    })(i);

            }
        }
    },

    showWait: function () {
        tinyMCEPopup.dom.get(this.current_tab+'_images_wait').style.display = 'inline-block';
    },
    hideWait: function () {
        tinyMCEPopup.dom.get(this.current_tab+'_images_wait').style.display = 'none';
    },

    loadData: function(order) {
        if(!order) order = "modified";

        var params = {
            ph:80,
            pw:80,
            sort:order,
            limit: ImageDialog.pageSize,
            start: (ImageDialog.page -1) * ImageDialog.pageSize
        };

        ImageDialog.showWait();
        var x = new XMLHttpRequest();
        x.onreadystatechange = function() {
            if (x.readyState === x.DONE) {
                data = JSON.parse(x.responseText);
                ImageDialog.images = data.images;
                ImageDialog.formatData(ImageDialog.images);
                ImageDialog.redrawData('',ImageDialog.current_tab+'_images_content');
                ImageDialog.hideWait();
                ImageDialog.pages_count = Math.ceil(data.total/ImageDialog.pageSize);
                document.getElementById(ImageDialog.current_tab+'_total_pages').innerHTML = ImageDialog.pages_count;
                document.getElementById(ImageDialog.current_tab+'_current_page').value = ImageDialog.page;
                if (ImageDialog.pages_count > 1)
                    document.getElementById(ImageDialog.current_tab+'_paginator').style.display = 'block';
            }
        };
        x.open('POST', ImageDialog.api_url+'listing');
        x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        x.send(ImageDialog.encodeParams(params));

    },

	insert : function(original) {
        original = typeof original !== 'undefined' ? original : false;
		var ed = tinyMCEPopup.editor, t = this, f = document.forms[0];

		if (f.src.value === '') {
			if (ed.selection.getNode().nodeName == 'IMG') {
				ed.dom.remove(ed.selection.getNode());
				ed.execCommand('mceRepaint');
			}

//			tinyMCEPopup.close();
			return;
		}

		if (tinyMCEPopup.getParam("accessibility_warnings", 1)) {
			if (!f.alt.value) {
				tinyMCEPopup.confirm(tinyMCEPopup.getLang('advimage_dlg.missing_alt'), function(s) {
					if (s)
                        t.checkUrl(f.src.value, t.insertAndClose, original);
				});
				return;
			}
		}

		t.checkUrl(f.src.value, t.insertAndClose, original);
	},


    testImage: function (url, callback, timeout)
    {
        timeout = timeout || 5000;
        var timedOut = false, timer;
        var img = new Image();
        var args = Array.prototype.slice.call(arguments).slice(2);
        img.onerror = img.onabort = function () {
            if (!timedOut) {
                tinyMCEPopup.confirm(tinyMCEPopup.getLang('advimage_dlg.incorrect_url'), function (s) {
                    if (s)
                        return callback.apply(ImageDialog, args);
                });
            }
        };
        img.onload = function () {
            if (!timedOut) {
                clearTimeout(timer);
                return callback.apply(ImageDialog, args);
            }
        };
        img.src = url;
        timer = setTimeout(function () {
            timedOut = true;
            tinyMCEPopup.confirm(tinyMCEPopup.getLang('advimage_dlg.incorrect_url'), function(s) {
                if (s)
                    return callback.apply(ImageDialog, args);
            });
        }, timeout);
    },

    checkUrl: function (url, callback) {
        var args = Array.prototype.slice.call(arguments).slice(2);
        ImageDialog.testImage(url, callback);
//        var x = new XMLHttpRequest();
//        x.onreadystatechange = function() {
//            if (x.readyState === x.DONE) {
//                var ct = this.getResponseHeader('content-type');
//                if (ct != null && ct.indexOf('image') !== -1) {
//                    return callback.apply(ImageDialog, args);
//                } else {
//                    tinyMCEPopup.confirm(tinyMCEPopup.getLang('advimage_dlg.incorrect_url'), function(s) {
//                        if (s)
//                            return callback.apply(ImageDialog, args);
//                    });
//                }
//            }
//        };
//        x.open('HEAD', url, true);
//        x.send();
    },

    insertOriginal: function(){
        console.log(ImageDialog.current_tab);
        var f = document.forms[0], nl = f.elements;
        nl.width.value = ImageDialog.current_image.width;
        nl.height.value = ImageDialog.current_image.height;
        ImageDialog.insert(true);
    },

	insertAndClose : function(original) {
        original = typeof original !== 'undefined' ? original : false;
		var ed = tinyMCEPopup.editor, f = document.forms[0], nl = f.elements, args = {}, el;

		tinyMCEPopup.restoreSelection();

		// Fixes crash in Safari
		if (tinymce.isWebKit)
			ed.getWin().focus();

		if (!ed.settings.inline_styles) {
			args = {
				vspace : nl.vspace.value,
				hspace : nl.hspace.value,
				border : nl.border.value,
				align : getSelectValue(f, 'align')
			};
		} else {
			// Remove deprecated values
			args = {
				vspace : '',
				hspace : '',
				border : '',
				align : ''
			};
		}

		tinymce.extend(args, {
			src : original || this.isExternalImg() ? nl.src.value.replace(/ /g, '%20'): nl.src.value.replace(/ /g, '%20') + '/preview/'+ nl.width.value+'x'+nl.height.value,
            width: original || this.isExternalImg() ? nl.width.value: '',
            height: original || this.isExternalImg() ? nl.height.value: '',
			alt : nl.alt.value,
			title : nl.title.value,
			'class' : getSelectValue(f, 'class_list'),
			style : nl.style.value,
			id : nl.id.value,
			dir : nl.dir.value,
			lang : nl.lang.value,
			usemap : nl.usemap.value,
			longdesc : nl.longdesc.value
		});

		args.onmouseover = args.onmouseout = '';

		if (f.onmousemovecheck.checked) {
			if (nl.onmouseoversrc.value)
				args.onmouseover = "this.src='" + nl.onmouseoversrc.value + "';";

			if (nl.onmouseoutsrc.value)
				args.onmouseout = "this.src='" + nl.onmouseoutsrc.value + "';";
		}

		el = ed.selection.getNode();

        if (el && el.nodeName == 'IMG') {
			ed.dom.setAttribs(el, args);
		} else {
			tinymce.each(args, function(value, name) {
				if (value === "") {
					delete args[name];
				}
			});

			ed.execCommand('mceInsertContent', false, tinyMCEPopup.editor.dom.createHTML('img', args), {skip_undo : 1});
			ed.undoManager.add();
		}

		tinyMCEPopup.editor.execCommand('mceRepaint');
		tinyMCEPopup.editor.focus();
		tinyMCEPopup.close();
	},

	getAttrib : function(e, at) {
		var ed = tinyMCEPopup.editor, dom = ed.dom, v, v2;

		if (ed.settings.inline_styles) {
			switch (at) {
				case 'align':
					if (v = dom.getStyle(e, 'float'))
						return v;

					if (v = dom.getStyle(e, 'vertical-align'))
						return v;

					break;

				case 'hspace':
					v = dom.getStyle(e, 'margin-left')
					v2 = dom.getStyle(e, 'margin-right');

					if (v && v == v2)
						return parseInt(v.replace(/[^0-9]/g, ''));

					break;

				case 'vspace':
					v = dom.getStyle(e, 'margin-top')
					v2 = dom.getStyle(e, 'margin-bottom');
					if (v && v == v2)
						return parseInt(v.replace(/[^0-9]/g, ''));

					break;

				case 'border':
					v = 0;

					tinymce.each(['top', 'right', 'bottom', 'left'], function(sv) {
						sv = dom.getStyle(e, 'border-' + sv + '-width');

						// False or not the same as prev
						if (!sv || (sv != v && v !== 0)) {
							v = 0;
							return false;
						}

						if (sv)
							v = sv;
					});

					if (v)
						return parseInt(v.replace(/[^0-9]/g, ''));

					break;
			}
		}

		if (v = dom.getAttrib(e, at))
			return v;

		return '';
	},

	setSwapImage : function(st) {
		var f = document.forms[0];

		f.onmousemovecheck.checked = st;
		setBrowserDisabled('overbrowser', !st);
		setBrowserDisabled('outbrowser', !st);

		if (f.over_list)
			f.over_list.disabled = !st;

		if (f.out_list)
			f.out_list.disabled = !st;

		f.onmouseoversrc.disabled = !st;
		f.onmouseoutsrc.disabled  = !st;
	},

	fillClassList : function(id) {
		var dom = tinyMCEPopup.dom, lst = dom.get(id), v, cl;

		if (v = tinyMCEPopup.getParam('theme_advanced_styles')) {
			cl = [];

			tinymce.each(v.split(';'), function(v) {
				var p = v.split('=');

				cl.push({'title' : p[0], 'class' : p[1]});
			});
		} else
			cl = tinyMCEPopup.editor.dom.getClasses();

		if (cl.length > 0) {
			lst.options.length = 0;
			lst.options[lst.options.length] = new Option(tinyMCEPopup.getLang('not_set'), '');

			tinymce.each(cl, function(o) {
				lst.options[lst.options.length] = new Option(o.title || o['class'], o['class']);
			});
		} else
			dom.remove(dom.getParent(id, 'tr'));
	},

	fillFileList : function(id, l) {
		var dom = tinyMCEPopup.dom, lst = dom.get(id), v, cl;

		l = typeof(l) === 'function' ? l() : window[l];
		lst.options.length = 0;

		if (l && l.length > 0) {
			lst.options[lst.options.length] = new Option('', '');

			tinymce.each(l, function(o) {
				lst.options[lst.options.length] = new Option(o[0], o[1]);
			});
		} else
			dom.remove(dom.getParent(id, 'tr'));
	},

	resetImageData : function() {
		var f = document.forms[0];

		f.elements.width.value = f.elements.height.value = '';
	},

	updateImageData : function(img, st) {
		var f = document.forms[0];
		if (!st) {
//			f.elements.width.value = img.width == 0 || img.width > ImageDialog.imageMaxWidth ? ImageDialog.imageMaxWidth : img.width;
//			f.elements.height.value = img.height == 0 || ImageDialog.imageMaxHeight ? ImageDialog.imageMaxHeight : img.height;
            if(img.width > ImageDialog.imageMaxWidth) {
                f.elements.width.value = ImageDialog.imageMaxWidth;
            } else {
                if (img.height > ImageDialog.imageMaxHeight) f.elements.height.value = ImageDialog.imageMaxHeight;
            }
		}
	},

	changeAppearance : function() {
		var ed = tinyMCEPopup.editor, f = document.forms[0], img = document.getElementById('alignSampleImg');

		if (img) {
			if (ed.getParam('inline_styles')) {
				ed.dom.setAttrib(img, 'style', f.style.value);
			} else {
				img.align = f.align.value;
				img.border = f.border.value;
				img.hspace = f.hspace.value;
				img.vspace = f.vspace.value;
			}
		}
	},

	changeHeight : function() {
		var f = document.forms[0], tp, t = this;

		if (!f.constrain.checked || !t.preloadImg) {
			return;
		}

		if (f.width.value == "" || f.height.value == "")
			return;

		tp = (parseInt(f.width.value) / parseInt(t.preloadImg.width)) * t.preloadImg.height;
		f.height.value = tp.toFixed(0);
	},

	changeWidth : function() {
		var f = document.forms[0], tp, t = this;

		if (!f.constrain.checked || !t.preloadImg) {
			return;
		}

		if (f.width.value == "" || f.height.value == "")
			return;

		tp = (parseInt(f.height.value) / parseInt(t.preloadImg.height)) * t.preloadImg.width;
		f.width.value = tp.toFixed(0);
	},

	updateStyle : function(ty) {
		var dom = tinyMCEPopup.dom, b, bStyle, bColor, v, isIE = tinymce.isIE, f = document.forms[0], img = dom.create('img', {style : dom.get('style').value});

		if (tinyMCEPopup.editor.settings.inline_styles) {
			// Handle align
			if (ty == 'align') {
				dom.setStyle(img, 'float', '');
				dom.setStyle(img, 'vertical-align', '');

				v = getSelectValue(f, 'align');
				if (v) {
					if (v == 'left' || v == 'right')
						dom.setStyle(img, 'float', v);
					else
						img.style.verticalAlign = v;
				}
			}

			// Handle border
			if (ty == 'border') {
				b = img.style.border ? img.style.border.split(' ') : [];
				bStyle = dom.getStyle(img, 'border-style');
				bColor = dom.getStyle(img, 'border-color');

				dom.setStyle(img, 'border', '');

				v = f.border.value;
				if (v || v == '0') {
					if (v == '0')
						img.style.border = isIE ? '0' : '0 none none';
					else {
						var isOldIE = tinymce.isIE && (!document.documentMode || document.documentMode < 9);

						if (b.length == 3 && b[isOldIE ? 2 : 1])
							bStyle = b[isOldIE ? 2 : 1];
						else if (!bStyle || bStyle == 'none')
							bStyle = 'solid';
						if (b.length == 3 && b[isIE ? 0 : 2])
							bColor = b[isOldIE ? 0 : 2];
						else if (!bColor || bColor == 'none')
							bColor = 'black';
						img.style.border = v + 'px ' + bStyle + ' ' + bColor;
					}
				}
			}

			// Handle hspace
			if (ty == 'hspace') {
				dom.setStyle(img, 'marginLeft', '');
				dom.setStyle(img, 'marginRight', '');

				v = f.hspace.value;
				if (v) {
					img.style.marginLeft = v + 'px';
					img.style.marginRight = v + 'px';
				}
			}

			// Handle vspace
			if (ty == 'vspace') {
				dom.setStyle(img, 'marginTop', '');
				dom.setStyle(img, 'marginBottom', '');

				v = f.vspace.value;
				if (v) {
					img.style.marginTop = v + 'px';
					img.style.marginBottom = v + 'px';
				}
			}

			// Merge
			dom.get('style').value = dom.serializeStyle(dom.parseStyle(img.style.cssText), 'img');
		}
	},

	showPreviewImage : function(u, st) {
		if (!u) {
			tinyMCEPopup.dom.setHTML('prev', '');
			return;
		}

		if (!st && tinyMCEPopup.getParam("advimage_update_dimensions_onchange", true))
			this.resetImageData();

		u = tinyMCEPopup.editor.documentBaseURI.toAbsolute(u);

		if (!st)
			tinyMCEPopup.dom.setHTML('prev', '<img id="previewImg" src="' + u + '" border="0" onload="ImageDialog.updateImageData(this);" onerror="ImageDialog.resetImageData();" />');
		else
			tinyMCEPopup.dom.setHTML('prev', '<img id="previewImg" src="' + u + '" border="0" onload="ImageDialog.updateImageData(this, 1);" />');
    },

    success: function (d) {
        ImageDialog.hideWait();

//        d = d.replace('<pre>', '').replace('</pre>', '');
//        var data = JSON.parse(d);
//        if(!data.success) {
//            tinyMCEPopup.dom.get(ImageDialog.current_tab+'z_error').innerHTML = data.error;
//            setTimeout(ImageDialog.hideError, 3000);
//        } else {
//            ImageDialog.loadData();
//        }
            ImageDialog.loadData();
    },

    upload: function(form) {
        var $ = tinyMCE.activeEditor.getWin().parent.jQuery;
        this.showWait()
        if (ImageDialog.current_tab == 'my') {
            form.my_img_file.name = 'file';
            form.document_img_file.value = '';
        } else {
            form.document_img_file.name = 'file';
            form.my_img_file.value = '';
        }

        $(form).ajaxSubmit({
            type: 'post',
            url: ImageDialog.api_url+'upload',
            success: function (data) {
//                console.log(data);
                ImageDialog.success();
            }
        });

        if (ImageDialog.current_tab == 'my') {
            form.file.name = 'my_img_file';
        } else {
            form.file.name = 'document_img_file';
        }
        form.my_img_file.value = '';
        form.document_img_file.value = '';
    },

    order: function(sel) {
        this.loadData(sel.value);
    },

    remove: function(image) {

        tinyMCEPopup.confirm(tinyMCEPopup.getLang('advimage_dlg.remove_img')+image.title +"?", function(s) {
            if (s){
                ImageDialog.showWait();
                var x = new XMLHttpRequest();
                x.onreadystatechange = function() {
                    if (x.readyState === x.DONE) {
                        ImageDialog.clearImageInfo();
                        ImageDialog.resetImageData();
                        ImageDialog.loadData();
                        ImageDialog.hideWait();
                    }
                };
                x.open('POST', ImageDialog.api_url+'remove');
                x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                x.send('image='+image.title);
            }
        })
    },

    activateImg: function(image) {
        for (var i=0; i < tinyMCEPopup.dom.get('my_images_content').children.length; i++) {
            tinyMCEPopup.dom.get('my_images_content').children[i].classList.remove('active');
        }

        for (var i=0; i < tinyMCEPopup.dom.get('document_images_content').children.length; i++) {
            tinyMCEPopup.dom.get('document_images_content').children[i].classList.remove('active');
        }

        tinyMCEPopup.dom.get('_img'+ image.id).classList.add('active');
        ImageDialog.current_image =  image;
        ImageDialog.setImageInfo();
    },

    setImageInfo: function() {
        var image = ImageDialog.current_image;
        var f = document.forms[0], nl = f.elements;
        nl.src.value = image.url;
        nl.alt.value = image.name;
        nl.title.value = image.label;
        ImageDialog.showPreviewImage(nl.src.value);
    },

    clearImageInfo: function() {
        var f = document.forms[0], nl = f.elements;
        nl.src.value = '';
        nl.alt.value = '';
        nl.title.value = '';
        nl.width.value = '';
        nl.height.value = '';
        ImageDialog.showPreviewImage(nl.src.value);
    },

    changeImageTab: function (tab) {
        ImageDialog.current_tab = tab;
        if (tab == 'document') {
            ImageDialog.api_url = tinyMCE.activeEditor.getParam('url1');
        } else {
            ImageDialog.api_url = tinyMCE.activeEditor.getParam('url2');
        }
        ImageDialog.page = 1;
        ImageDialog.loadData();
    },

    dimensionsFromSrc: function (src){
        var regexp = /(\d+)x(\d+)/;
        return regexp.exec(src);
    },

    isExternalImg: function() {
        var f = document.forms[0], nl = f.elements;
        return nl.src.value.match(/^http/) != null || this.current_image;
    },

    nextPage: function () {
        if (ImageDialog.page + 1 <= ImageDialog.pages_count){
            ImageDialog.page = ImageDialog.page < ImageDialog.pages_count ? ImageDialog.page + 1: ImageDialog.pages_count;
            ImageDialog.loadData();
        }
        return false;
    },
    prevPage: function () {
        if (ImageDialog.page - 1 >= 1){
            ImageDialog.page = ImageDialog.page > 1 ? ImageDialog.page-1: 1;
            ImageDialog.loadData();
        }
        return false;
    },
    toPage: function (n) {
        var p = parseInt(n);
        if (!isNaN(p)){
            p = (0 < p) && (p < ImageDialog.pages_count) ? p: ImageDialog.pages_count;
            if (p != ImageDialog.page) {
                ImageDialog.page = p;
                ImageDialog.loadData();
            }
            document.getElementById(ImageDialog.current_tab+'_current_page').value = p;
        } else {
            document.getElementById(ImageDialog.current_tab+'_current_page').value = ImageDialog.page;
        }
        return false;
    },
    lastPage: function () {
        if (ImageDialog.page != ImageDialog.pages_count)
            ImageDialog.toPage(ImageDialog.pages_count);
        return false;
    },
    firstPage: function () {
        if (ImageDialog.page != 1)
            ImageDialog.toPage(1);
        return false;
    },


    selectExternalImage: function (select) {
        document.getElementById('src').value = select.options[select.selectedIndex].value;
        document.getElementById('alt').value = select.options[select.selectedIndex].text;
        document.getElementById('title').value = select.options[select.selectedIndex].text;
        ImageDialog.showPreviewImage(select.options[select.selectedIndex].value);
    },

    encodeParams: function (params) {
        var s = ''
        for (i in params)
            s+=encodeURIComponent(i)+'='+encodeURIComponent(params[i])+'&';
        return s
    }

};

ImageDialog.preInit();
tinyMCEPopup.onInit.add(ImageDialog.init, ImageDialog);
