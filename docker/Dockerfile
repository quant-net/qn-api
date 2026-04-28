FROM nikolaik/python-nodejs:python3.12-nodejs25-slim AS build

RUN apt-get update && \
    apt-get install --yes --no-install-recommends \
    openssh-client \ 
    git \
    && apt-get clean

RUN pip install --upgrade pip setuptools wheel

RUN git clone --single-branch --branch develop https://github.com/quant-net/qn-mq && \
    cd qn-mq && pip install -e .
RUN git clone --single-branch --branch develop https://github.com/quant-net/qn-server && \
    cd qn-server && pip install -e .
RUN git clone --single-branch --branch develop https://github.com/quant-net/qn-plugins

RUN git clone --single-branch --branch develop https://github.com/quant-net/qn-api && \
    cd qn-api && \
    pip install -e . && \
    npm install && \
    npm run build

WORKDIR /qn-api

CMD ["qn-api"]

