
(function(tinymce) {
    tinymce.create('tinymce.plugins.ZojaxmPlugin', {
        init : function(ed, url) {
            // Register commands
            ed.addCommand('mceZojaxm', function() {
                ed.windowManager.open({
                    file : url + '/media.htm',
                    width : 600,
                    height : 430,
                    inline : 1
                }, {
                    plugin_url : url
                });
            });

            // Register buttons
            ed.addButton('zojaxm', {title : 'Zojax Media', cmd : 'mceZojaxm', image : url + '/img/example.gif'});
        },

        getInfo : function() {
            return {
                longname : 'Zojaxm',
                author : 'Garry Lysenko',
                version : tinymce.majorVersion + "." + tinymce.minorVersion,
                content_id : tinymce.content_id
            };
        }
    });

    // Register plugin
    tinymce.PluginManager.add('zojaxm', tinymce.plugins.ZojaxmPlugin);
})(tinymce);