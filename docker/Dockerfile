FROM nikolaik/python-nodejs:python3.12-nodejs25-slim AS build

RUN apt-get update && \
    apt-get install --yes --no-install-recommends \
    openssh-client \ 
    git \
    && apt-get clean

RUN pip install --upgrade pip setuptools wheel

ARG BRANCH

RUN echo "Dockerfile BRANCH value is: ${BRANCH}"

RUN git clone --single-branch --branch ${BRANCH} https://github.com/quant-net/qn-mq && \
    cd qn-mq && pip install --no-cache-dir .
RUN git clone --single-branch --branch ${BRANCH} https://github.com/quant-net/qn-server && \
    cd qn-server && pip install --no-cache-dir .
RUN git clone --single-branch --branch ${BRANCH} https://github.com/quant-net/qn-plugins

RUN git clone --single-branch --branch ${BRANCH} https://github.com/quant-net/qn-api && \
    cd qn-api && \
    pip install --no-cache-dir -e . && \
    npm install && \
    npm run build

WORKDIR /qn-api

CMD ["qn-api"]
