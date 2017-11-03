##############################################################################
#
# Copyright (c) 2009 Zope Foundation and Contributors.
# All Rights Reserved.
#
# This software is subject to the provisions of the Zope Public License,
# Version 2.1 (ZPL).  A copy of the ZPL should accompany this distribution.
# THIS SOFTWARE IS PROVIDED "AS IS" AND ANY AND ALL EXPRESS OR IMPLIED
# WARRANTIES ARE DISCLAIMED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF TITLE, MERCHANTABILITY, AGAINST INFRINGEMENT, AND FITNESS
# FOR A PARTICULAR PURPOSE.
#
##############################################################################
"""

$Id$
"""
from zope import schema, interface
from zope.i18nmessageid import MessageFactory

# from z3c.schema.baseurl.field import BaseURL

_ = MessageFactory('zojax.widget.extjseditor')


class TinyMCEEditor(interface.Interface):
    """ rich text field """

    imageMaxWidth = schema.TextLine(
        title=_('Max Image Width'),
        description=_('The maximum width of the image is inserted via the wysiwyg-editor'),
        default=u'480')

    imageMaxHeight = schema.TextLine(
        title=_('Max Image Height'),
        description=_('The maximum height of the image is inserted via the wysiwyg-editor'),
        default=u'360')
#
    wistiaApiUsername = schema.TextLine(
        title=_('Wistia API Username'),
        default=u'api',
        required=False)

    wistiaApiPassword = schema.TextLine(
        title=_('Wistia API Password'),
        default=u'50fe24d3645fd924b3b2ce55aa061273104ecb40',
        required=False)

    wistiaBaseApiUrl = schema.TextLine(
        title=_('Wistia Base API URL'),
        default=u'https://api.wistia.com/v1/',
        required=False)

    wistiaApiProxyUrl = schema.TextLine(
        title=_('Wistia API Proxy URL for TinyMCE'),
        default=u'/WistiaTinyMCEJsAPI/',
        required=False)

    validElements = schema.TextLine(
        title=_('Extended Valid Elements'),
        description=_('tag1[attribute1|attribute2],tag2[*]'),
        default=u'',
        required=False)

    disableHtmlVerify = schema.Bool(
        title=_('Disable Html Verify'),
        description=_('The same as *[*] for the Extended Valid Elements field'),
        default=False,
        required=False)

    # autoUpload = schema.Bool(
    #     title=_('Allow image browser auto upload'),
    #     default=True,
    #     required=False,)
    #