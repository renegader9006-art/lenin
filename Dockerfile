FROM ubuntu:22.04

RUN apt update && apt install -y \
    g++ \
    python3-pip \
    libboost-all-dev \
    nlohmann-json3-dev \
    libssl-dev \
    openssl \
    locales \
    && locale-gen ru_RU.UTF-8 \
    && update-locale LANG=ru_RU.UTF-8 \
    && apt clean

ENV LANG=ru_RU.UTF-8
ENV LANGUAGE=ru_RU:ru
ENV LC_ALL=ru_RU.UTF-8

RUN pip3 install fastapi uvicorn

WORKDIR /app

COPY . .

RUN cd AdminPart && g++ -std=c++20 -o server main.cpp \
    -lpthread \
    -lboost_system \
    -lssl \
    -lcrypto

RUN rm -rf /app/AdminPart/admin /app/AdminPart/fals /app/AdminPart/main.cpp

EXPOSE 80 8080
CMD cd /app/AdminPart && ./server & cd /app/ClientPart && python3 -m uvicorn main:app --host 0.0.0.0 --port 80