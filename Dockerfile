# syntax=docker/dockerfile:1
FROM node:22.21.1-bookworm

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    bash \
    openssh-client \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /testbed

RUN git clone https://github.com/ddhiman-alt/nearpaws.git .

RUN npm ci

RUN chmod -R 777 /testbed
