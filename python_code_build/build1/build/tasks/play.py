#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import fnmatch
from pybuilder.core import task
from .task_base import *

__all__ = [
    "run"
]


@task("run", "Run application by shell script.")
def run(project):
    #TODO: solve issue: BUILD FAILED - 'str' object has no attribute 'basedir'
    base_dir = project.basedir
    python_dir = project.get_property("python_dir")
    script = os.path.join(base_dir, python_dir, "start.sh")
    run("chmod +x %s && $(which env) bash %s" % (script, script))
