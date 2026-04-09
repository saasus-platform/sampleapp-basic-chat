FROM php:8.0-fpm

# --- Node.js のインストール（OSバージョンを bullseye に固定して整合性を確保） ---
COPY --from=node:20-bullseye-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:20-bullseye-slim /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
COPY --from=node:20-bullseye-slim /usr/local/lib/node_modules/corepack /usr/local/lib/node_modules/corepack

# 実行するためのショートカット（シンボリックリンク）を作成
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && ln -sf /usr/local/lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack

COPY php.ini /usr/local/etc/php/

# パッケージインストールを整理
RUN apt-get update && apt-get install -y --no-install-recommends \
    zlib1g-dev \
    mariadb-client \
    vim \
    libzip-dev \
    libpq-dev \
    && docker-php-ext-install zip pdo_mysql pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# --- Composer のインストール（バージョンを 2.2 系に固定） ---
COPY --from=composer:2.2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_HOME /composer
ENV PATH $PATH:/composer/vendor/bin

WORKDIR /var/www