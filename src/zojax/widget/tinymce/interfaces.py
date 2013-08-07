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

from z3c.schema.baseurl.field import BaseURL

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
    wistiaApiUsername = schema.TextLine(title=_('Wistia API Username'),
                                default = u'api',
                                required = False,)

    wistiaApiPassword = schema.TextLine(title=_('Wistia API Password'),
                                default = u'128c131035e547c01d1ed370e2bbdcdf96c6424e',
                                required = False,)

    wistiaBaseApiUrl = schema.TextLine(title=_('Wistia Base API URL'),
                        default = u'https://api.wistia.com/v1/',
                        required = False,)

    wistiaApiProxyUrl = schema.TextLine(title=_('Wistia API Proxy URL for TinyMCE'),
        default = u'/WistiaTinyMCEJsAPI/',
        required = False,)

    # autoUpload = schema.Bool(title=_('Allow image browser auto upload'),
    #     default = True,
    #     required = False,)