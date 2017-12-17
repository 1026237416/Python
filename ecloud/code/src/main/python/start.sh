#! /bin/sh

ps -aux|grep server.py|grep -v 'grep'|awk '{print $2}'|xargs kill -9
ps -aux|grep task.py|grep -v 'grep'|awk '{print $2}'|xargs kill -9
ps -aux|grep message.py|grep -v 'grep'|awk '{print $2}'|xargs kill -9

python server.py  --config-file ../etc/ecloud.conf &
python task.py  --config-file ../etc/ecloud.conf &
python message.py  --config-file ../etc/ecloud.conf &

