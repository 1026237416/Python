#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import fnmatch
from pybuilder.core import task
from .task_base import *

__all__ = [
    "clean",
    "compile_source",
    "package"
]


@task("clean", "clean build result files generated.")
def clean(project):
    print "starting cleaning compiled files..."
    code_root = project.get_property("code_root")
    python_dir = project.get_property("python_dir")
    print "cleaning all built files in target dir..."
    run("rm -rf %s" % os.path.join(code_root, "target"))
    print "cleaning compiled .pyc files..."
    run('find %s -name "*.pyc" -exec rm -rf {} \;' % python_dir)
    print "done."


@task("compile", "compile source files and copy config scripts.")
def compile_source(project):
    print "Starting compile .py files..."
    code_root = project.get_property("code_root")
    python_dir = project.get_property("python_dir")
    web_dir = project.get_property("web_dir")
    config_dir = project.get_property("config_dir")
    target_dir = os.path.join(code_root, "target", "dist", "%s-%s" % (project.name, project.version))
    run("python -m compileall %s" % os.path.join(code_root, python_dir))
    print "compiling finished."
    print "moving .pyc files into target dir..."
    for root, dirnames, filenames in os.walk(python_dir):
        for filename in fnmatch.filter(filenames, '*.pyc'):
            file_path = os.path.join(code_root, root, filename)
            target_path = os.path.join(target_dir,
                                       file_path.replace(os.path.join(code_root, python_dir) + "/", "python/"))
            print file_path, " -> ", target_path
            run("mkdir -p %s && mv -f %s %s" % (os.path.dirname(target_path), file_path, target_path))
    print "coping config files..."
    run("cp -rf %s %s" % (os.path.join(code_root, web_dir), target_dir))
    print "coping shell scripts..."
    run("cp -rf %s %s" % (os.path.join(code_root, python_dir, "*.sh"), os.path.join(target_dir, "python")))
    print "copying web package..."
    run("cp -rf %s %s" % (os.path.join(code_root, config_dir), target_dir))
    print "Done."


@task("packtar", "package compiled binaries and configs.")
def package(project):
    code_root = project.get_property("code_root")
    dist_dir = os.path.join(code_root, "target", "dist")
    package_source = "%s-%s" % (project.name, project.version)
    tar = dist_dir + "/" + package_source + ".tar"
    print "Packaging..."
    run("tar czf %s -C %s %s" % (tar, dist_dir, package_source))
    print "Done. Find product tar package file at %s" % tar
