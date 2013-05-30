"""Adapter to get the image list for an object - these are returned
to the tiny widget for insertion in the document

This is based on zojax.content.attachment.browser.jsapy
"""

from simplejson import JSONEncoder

from zope.publisher.browser import BrowserPage
from zope.traversing.api import getName, getPath
from zope.component import getUtility
from zope.proxy import removeAllProxies
from zope.app.intid.interfaces import IIntIds

from zojax.content.attachment.interfaces import IImage, IAttachmentsExtension, ILink, IFile

encoder = JSONEncoder()

class ImageList(BrowserPage):

    def __call__(self):
        ids = getUtility(IIntIds)

        data = []
        for name, image in IAttachmentsExtension(self.context).items():
            if IImage.providedBy(image) and image:
                id = ids.queryId(removeAllProxies(image))
                title = image.title or getName(image)
                data.append((title,  '@@content.attachment/%s' % id))

        data.sort()
        js_encoded = encoder.encode(data)

        return """tinyMCEImageList = new Array(%s);""" % js_encoded[1:-1]

class LinkList(BrowserPage):

    def __call__(self):
        ids = getUtility(IIntIds)

        data = []
        for name, link in IAttachmentsExtension(self.context).items():
            if ILink.providedBy(link) and link:
                title = link.title or getName(link)
                data.append((title,  link.url))

        data.sort()
        js_encoded = encoder.encode(data)

        return """tinyMCELinkList = new Array(%s);""" % js_encoded[1:-1]


class FileList(BrowserPage):
    # I assume that attached files are media files

    def __call__(self):
        ids = getUtility(IIntIds)

        data = []
        for name, file in IAttachmentsExtension(self.context).items():
            if IFile.providedBy(file) and file:
                id = ids.queryId(removeAllProxies(file))
                title = file.title or getName(file)
                data.append((title,  '++attachment++%s' % id))

        data.sort()
        js_encoded = encoder.encode(data)

        return """tinyMCEMediaList = new Array(%s);""" % js_encoded[1:-1]
