#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: test.py
    @time: 2017/5/4 22:44
"""

from xml.etree.ElementTree import ElementTree, Element


def read_xml(in_path):
    """   
    read and parser a XML file
    :param in_path: path of XML file
    :return: ElementTree
    """
    tree = ElementTree()
    tree.parse(in_path)
    return tree


def write_xml(tree, out_path):
    """
    write a XML file
    :param tree: a XML tree
    :param out_path: output path
    :return: None
    """
    tree.write(out_path, encoding="utf-8", xml_declaration=True)


def if_match(node, kv_map):
    """
    judge a node exist 'kv_map'
    :param node: node name
    :param kv_map: a key and value map
    :return: exist return True, else return False
    """
    for key in kv_map:
        if node.get(key) != kv_map.get(key):
            return False
        else:
            return True


def find_nodes(tree, path):
    """
    
    :param tree: 
    :param path: 
    :return: None
    """
    return tree.findall(path)


def get_node_by_kv(nodelist, kv_map):
    """
    根据属性及属性值定位符合的节点，返回节点
    :param nodelist: 节点列表
    :param kv_map:  匹配属性及属性值map
    :return: 
    """
    result_nodes = []
    for node in nodelist:
        if if_match(node, kv_map):
            result_nodes.append(node)
    return result_nodes


def change_node_properties(nodelist, kv_map, is_delete=False):
    """
    修改/增加 /删除 节点的属性及属性值
    :param nodelist: 节点列表
    :param kv_map: 属性及属性值map
    :param is_delete: 是否删除
    :return: None
    """
    for node in nodelist:
        for key in kv_map:
            if is_delete:
                if key in node.attrib:
                    del node.attrib[key]
            else:
                node.set(key, kv_map.get(key))


def change_node_text(nodelist, text, is_add=False, is_delete=False):
    """
    改变/增加/删除一个节点的文本
    :param nodelist: 节点列表
    :param text: 更新后的文本
    :param is_add: 是否为添加文本内容
    :param is_delete: 是否为删除文本内容
    :return: None
    """
    for node in nodelist:
        if is_add:
            node.text += text
        elif is_delete:
            node.text = ""
        else:
            node.text = text


def create_node(tag, property_map, content):
    """
    新创建一个节点
    :param tag: 节点标签
    :param property_map: 属性及属性值map
    :param content: 节点闭合标签里的文本内容
    :return: 新节点
    """
    element = Element(tag, property_map)
    element.text = content
    return element


def add_child_node(nodelist, element):
    """
    给一个节点添加子节点
    :param nodelist: 节点列表
    :param element: 子节点
    :return: 
    """
    for node in nodelist:
        node.append(element)


def del_node_by_tagkeyvalue(nodelist, tag, kv_map):
    """
    同过属性及属性值定位一个节点，并删除之
    :param nodelist:  父节点列表
    :param tag: 子节点标签
    :param kv_map: 属性及属性值列表
    :return: 
    """
    for parent_node in nodelist:
        children = parent_node.getchildren()
        for child in children:
            if child.tag == tag and if_match(child, kv_map):
                parent_node.remove(child)


if __name__ == "__main__":
    tree = read_xml("xml.xml")
    nodes = find_nodes(tree, "processers/processer")
    print nodes
    result_nodes = get_node_by_kv(nodes, {"name": "BProcesser"})
    print result_nodes
