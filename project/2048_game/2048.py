#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/9/14 21:57
# @Author  : liping
# @File    : 2048.py
# @Software: PyCharm

import curses
from random import randrange, choice
from collections import defaultdict

actions = ["Up", "Left", "Down", "Right", "Restart", "Exit"]
letter_codes = [ord(ch) for ch in "WASDRQwasdrq"]
actions_dict = dict(zip(letter_codes, actions * 2))


def main(stdscr):
    def init():
        return "Game"

    def not_game(state):
        responses = defaultdict(lambda: state)
        responses['Restart'], responses["Exit"] = "Init", "Exit"
        return responses[actions]

    def game():
        pass
