FROM python:2.7

MAINTAINER liping <liping@gcstgroup.com>

RUN mkdir -p /qloudtest/linux_windows_qloudTest

COPY ./robotframework-2.8.7.tar /qloudtest/linux_windows_qloudTest/
COPY ./QloudTest/ /qloudtest/linux_windows_qloudTest/QloudTest

WORKDIR /qloudtest/linux_windows_qloudTest/

RUN pip install robotframework-2.8.7.tar && \
    pip install urllib3==1.22 && \
    pip install decorator==3.4.2 && \
    pip install elasticsearch==5.4.0 &&  \
    pip install selenium==3.12.0 && \
    pip install robotframework-selenium2library==1.8.0 && \
    pip install boto==2.48.0 &&  \
    pip install configparser==3.5.0 && \
    pip install stomp.py==4.1.20 && \
    pip install Werkzeug==0.12.1 && \
    pip install MarkupSafe==1.0 && \
    pip install pytz==2017.2 && \
    pip install click==6.7 && \
    pip install itsdangerous==0.24 && \
    pip install certifi==2018.4.16 && \
    pip install idna==2.7 && \
    pip install chardet==3.0.4 && \
    pip install requests==2.18.4 && \
    pip install Flask==0.12.1 && \
    pip install pykafka

WORKDIR /qloudtest/linux_windows_qloudTest/QloudTest/engine/

CMD ["python", "/qloudtest/linux_windows_qloudTest/QloudTest/engine/caseengineapi.py"]