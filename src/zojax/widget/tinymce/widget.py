
"""z3c.form widget for tinyMCE

"""
__docformat__ = "reStructuredText"
import zope.component
import zope.interface
import zope.schema.interfaces
from zope.proxy import removeAllProxies
from zope.app.component.hooks import getSite
from zope.traversing.browser import absoluteURL

from z3c.form import interfaces
from z3c.form.widget import Widget, FieldWidget
from z3c.form.browser import widget
from z3c.form.browser.textarea import TextAreaWidget

from zojax.richtext.field import RichTextData
from zojax.richtext.interfaces import IRichTextData
from zojax.richtext.interfaces import IRichTextWidget, IRichTextWidgetFactory

from zojax.resourcepackage.library import include
from zojax.content.attachment.interfaces import IAttachmentsAware


template = """<script type="text/javascript">
tinyMCE.init({
mode : "exact", %(options)s
elements : "%(name)s" }); </script> """

OPT_PREFIX="mce_"
OPT_PREFIX_LEN = len(OPT_PREFIX)
MCE_LANGS=[]
import glob
import os

# initialize the language files
for langFile in glob.glob(
    os.path.join(os.path.dirname(__file__),'resources','langs') + '/??.js'):
    MCE_LANGS.append(os.path.basename(langFile)[:2])


class TinyMCETextWidget(TextAreaWidget):
    """Input type text widget implementation."""
    zope.interface.implements(IRichTextWidget)

    klass = u'tinymce-text-widget'
    cols = 80
    rows = 30

    mce_language = 'en'
    mce_mode = 'exact'
    mce_theme = "advanced"
    mce_theme_advanced_toolbar_location = "top"
    mce_theme_advanced_toolbar_align = "left"
    mce_theme_advanced_path_location = "bottom"
    mce_theme_advanced_statusbar_location = "bottom"
    mce_theme_advanced_resizing = True
    mce_button_tile_map = True

    mce_plugins = "safari,spellchecker,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template"
    # Theme options
    mce_theme_advanced_buttons1 = "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,styleselect,formatselect,fontselect,fontsizeselect"
    mce_theme_advanced_buttons2 = "cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,anchor,image,cleanup,help,code,|,insertdate,inserttime,preview,|,forecolor,backcolor"
    mce_theme_advanced_buttons3 = "tablecontrols,|,hr,removeformat,visualaid,|,sub,sup,|,charmap,emotions,iespell,media,advhr,|,print,|,ltr,rtl,|,fullscreen"
    mce_theme_advanced_buttons4 = "insertlayer,moveforward,movebackward,absolute,|,styleprops,spellchecker,|,cite,abbr,acronym,del,ins,attribs,|,visualchars,nonbreaking,template,blockquote,pagebreak,|,insertfile,insertimage"

    mce_plugin_insertdate_dateFormat = "%d/%m/%Y"
    mce_plugin_insertdate_timeFormat = "%H:%M:%S"
    mce_extended_valid_elements = "img[class|src|border=0|alt|title|hspace|vspace|width|height|align|onmouseover|onmouseout|name],hr[class|width|size|noshade],font[face|size|color|style],span[class|align|style]"

    mce_paste_auto_cleanup_on_paste = True
    mce_paste_convert_headers_to_strong = True

    # TODO: This is not working (and a portable path)
    @property
    def mce_content_css(self):
        return '%s/@@/zojax.css'%absoluteURL(getSite(), self.request)

    # disallow url conversions eg http://site/images/img.jpg to ../images/img.jpg
    mce_convert_urls = False

    def genScript(self):
        include('tiny-mce')

        if IAttachmentsAware.providedBy(self.context):
            # handle type error in case context doesn't have parent or name
            try:
                url = absoluteURL(self.context, self.request)
                self.mce_external_image_list_url = \
                    '"%s/@@tinymce_image_list.js?" + new Date().getTime()'%url
                self.mce_external_link_list_url = \
                    '"%s/@@tinymce_link_list.js?" + new Date().getTime()'%url
                self.mce_media_external_list_url = \
                    '"%s/@@tinymce_file_list.js?" + new Date().getTime()'%url
            except TypeError:
                pass

        mceOptions = []
        for k in dir(self):
            if k.startswith(OPT_PREFIX):
                v = getattr(self,k,None)
                v = v==True and 'true' or v==False and 'false' or v
                if v in ['true','false']:
                    mceOptions.append('%s : %s' % (k[OPT_PREFIX_LEN:],v))
                elif v is not None and len(v) > 0:
                    if v[0] in ['"', "'"]:
                        mceOptions.append('%s : %s' % (k[OPT_PREFIX_LEN:],v))
                    else:
                        mceOptions.append('%s : "%s"' % (k[OPT_PREFIX_LEN:],v))
        mceOptions = ',\n'.join(mceOptions)
        if mceOptions:
            mceOptions += ', '
        if self.request.locale.id.language in MCE_LANGS:
            mceOptions += ('language : "%s", ' % \
                           self.request.locale.id.language)
        return template % {"name": self.name, "options": mceOptions}

    def render(self):
        if self.mode == interfaces.DISPLAY_MODE:
            if IRichTextData.providedBy(self.value):
                self.value = removeAllProxies(self.value).cooked
            else:
                self.value = unicode(self.value)
        else:
            if IRichTextData.providedBy(self.value):
                self.value = removeAllProxies(self.value).text
            else:
                self.value = unicode(self.value)

        return super(TinyMCETextWidget, self).render()

    def extract(self, default=interfaces.NOVALUE):
        textarea = self.request.get(self.name, default)

        if textarea is default:
            return default

        return RichTextData(textarea, u'zope.source.html')


class TinyMCEWidgetFactory(object):
    zope.interface.implements(IRichTextWidgetFactory)

    title = u'Tiny MCE editor'

    def __call__(self, request):
        return TinyMCETextWidget(request)
