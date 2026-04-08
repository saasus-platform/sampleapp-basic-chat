FROM php:8.0-fpm

# --- Node.js のインストール（公式イメージからバイナリをコピー） ---
COPY --from=node:20-slim /usr/local/bin /usr/local/bin
COPY --from=node:20-slim /usr/local/lib/node_modules /usr/local/lib/node_modules

COPY php.ini /usr/local/etc/php/

# パッケージインストールを整理
RUN apt-get update && apt-get install -y \
    zlib1g-dev \
    mariadb-client \
    vim \
    libzip-dev \
    libpq-dev \
    && docker-php-ext-install zip pdo_mysql pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# --- Composer のインストール（公式イメージからコピー） ---
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_HOME /composer
ENV PATH $PATH:/composer/vendor/bin

WORKDIR /var/www