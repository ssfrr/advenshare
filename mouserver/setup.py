from distutils.core import setup, Extension

mouserver_ext = Extension('mouserver_ext', 
    sources=['mouserver_ext.c'],
    libraries=['xdo'],
)

setup(
    name = 'mouserver',
    version = '1.0',
    description = 'Advenshare Mouse Server',
    ext_modules = [mouserver_ext],
)
