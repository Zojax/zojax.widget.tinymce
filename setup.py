from setuptools import setup, find_packages
import os

def read(*rnames):
    return open(os.path.join(os.path.dirname(__file__), *rnames)).read()

version = '0'

setup(name='zojax.widget.tinymce',
      version=version,
      description="Tiny MCE HTML Editor Widget for zojax",
      long_description=(
          'Detailed Documentation\n' +
          '======================\n\n' +
          'This package contains a HTML editing widget using the TinyMCE JavaScript Library.\n' +
          'It is intended to provide an alternative to the ExtJS Editor Widget in zojax.\n\n' +
          'This work is based on other implementations of TinyMCE widget in Zope/Python, in\n' +
          'particular hurry.tinymce.\n\n\n' +
          read('CHANGES.txt')
          ),
      # Get more strings from http://www.python.org/pypi?%3Aaction=list_classifiers
      classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Zope Public License',
        'Programming Language :: Python',
        'Natural Language :: English',
        'Operating System :: OS Independent',
        'Topic :: Internet :: WWW/HTTP',
        'Framework :: Zope3'],
      keywords='',
      author='Kevin Gill',
      author_email='kevin.gill@openapp.ie',
      url='http://zojax.net/',
      license='ZPL 2.1',
      packages=find_packages('src'),
      package_dir = {'':'src'},
      namespace_packages=['zojax', 'zojax.widget'],
      include_package_data=True,
      zip_safe=False,
      install_requires = ['setuptools',
                          'z3c.form',
                          'zojax.resource',
                          'zojax.resourcepackage',
                          'zojax.content.attachment',
                          'zojax.richtext',
                          ],
      extras_require = dict(test=['zope.app.testing',
                                  'zope.app.zcmlfiles',
                                  'zope.testing',
                                  'zope.testbrowser',
                                  'zope.securitypolicy',
                                  ]),
      )
