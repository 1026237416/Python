#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: SingleLinkList.py
    @time: 2018/4/15 21:04
"""


class Node(object):
    """
    单链表的节点
    """

    def __init__(self, elem):
        self.elem = elem
        self.next = None


class SingleLinkList(object):
    """
    定义一个单链表
    """

    def __init__(self, node=None):
        self.__head = node

    def is_empty(self):
        """
        判断链表是否为空
        Returns:

        """
        if self.__head is None:
            return True
        else:
            return False

    def length(self):
        """
        获取链表的长度
        Returns:
        """
        cur = self.__head
        count = 0
        while cur is not None:
            count += 1
            cur = cur.next
        return count

    def travel(self):
        """
        遍历整个链表
        Returns:
        """
        cur = self.__head
        while cur is not None:
            print(cur.elem, end=" ")
            cur = cur.next

    def add(self, item):
        """
        在链表头部添加元素
        Args:
            item: 需要添加的元素

        Returns: None
        """
        node = Node(item)
        node.next = self.__head
        self.__head = node

    def append(self, item):
        """
        在链表的尾部添加元素
        Args:
            item: 需要添加的元素
        Returns: None
        """
        node = Node(item)
        if self.is_empty():
            self.__head = node
        else:
            cur = self.__head
            while cur.next is not None:
                cur = cur.next
            cur.next = node

    def insert(self, pos, item):
        """
        在指定的位置添加元素
        Args:
            pos: 添加元素的位置
            item: 需要添加的元素

        Returns: None
        """
        pre = self.__head

        if pos <= 0:
            self.add(item)
        elif (self.length() - 1) < pos:
            self.append(item)
        else:
            # if self.length() < pos:
            #     raise IndexError()
            count = 0
            while count < (pos - 1):
                pre = pre.next
                count += 1
            # 当循环退出，pre指向插入的上一个节点
            node = Node(item)
            node.next = pre.next
            pre.next = node

    def remove(self, item):
        """
        删除指定元素
        Args:
            item: 需要删除的元素
        Returns:None
        """
        cur = self.__head
        pre = None
        while cur is not None:
            if cur.elem == item:
                if cur == self.__head:
                    self.__head = cur.next
                else:
                    pre.next = cur.next
                return True
            else:
                pre = cur
                cur = cur.next
        return False

    def search(self, item):
        """
        查询元素是否存在
        Args:
            item: 需要查询的元素
        Returns:
        """
        cur = self.__head
        while cur.next is not None:
            if cur.elem == item:
                return True
            else:
                cur = cur.next
        return False


if __name__ == '__main__':
    ll = SingleLinkList()
    print("is empty:", ll.is_empty())
    print("list length:", ll.length())
    ll.append(1)
    print("is empty:", ll.is_empty())
    print("list length:", ll.length())
    ll.append(2)
    ll.add(8)
    ll.append(3)
    ll.append(4)
    ll.insert(1, 99)
    ll.travel()
    print()
    print(ll.remove(99))
    print(ll.remove(8))
    print(ll.remove(4))
    ll.travel()
    print()
    print(ll.search(8))
    print(ll.search(2))
    print(ll.search(1))

