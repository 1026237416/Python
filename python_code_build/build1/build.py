import os
import sys
from pybuilder.core import use_plugin, init

use_plugin("python.core")
use_plugin("python.unittest")
use_plugin("python.install_dependencies")
use_plugin("python.coverage")
use_plugin("python.distutils")

name = "engine"

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'build')))
from tasks import *

default_task = "run"


@init
def set_properties(project):
    project.version = "1.0.0"
    project.set_property("code_root", os.path.dirname(__file__))
    # project.set_property("dir_source_unittest_python", "src/test/python")
    # project.set_property("dir_docs", "../../doc")
    # project.set_property("config_dir", "src/main/etc")
    project.set_property("python_dir", "engine")
    # project.set_property("web_dir", "src/main/web")

    project.set_property("distutils_classifiers", [
        'Development Status :: 3 - Alpha',
        'Environment :: OpenStack based clusters',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3.2'])
