from setuptools import setup, Extension, find_packages

mouserver_ext = Extension('mouserver_ext', 
    sources=['mouserver_ext.c'],
    libraries=['xdo'],
)

setup(
    name = 'mouserver',
    version = '1.0',
    description = 'Advenshare Mouse Server',
    packages = find_packages(),
    ext_modules = [mouserver_ext],

    install_requires = [
        'websocket-client>=0.12.0',
        'coloredlogs>=0.5',
    ],

    entry_points = {
        'console_scripts': [
            'mouserver = mouserver.server:main',
        ],
    },
)
