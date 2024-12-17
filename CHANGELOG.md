# Changelog

## [2.3.1](https://github.com/otakustay/ipc/compare/v2.3.0...v2.3.1) (2024-12-17)


### Bug Fixes

* export required types for server and client ([4bc12dc](https://github.com/otakustay/ipc/commit/4bc12dc92825585477b4f9d0868adae45639be3e))

## [2.3.0](https://github.com/otakustay/ipc/compare/v2.2.0...v2.3.0) (2024-12-17)


### Features

* add handleNotice method to Client ([#17](https://github.com/otakustay/ipc/issues/17)) ([f475a25](https://github.com/otakustay/ipc/commit/f475a250cd01ea13bd5a4f5d9f6321d6284d3701))
* add namespace to server and client ([#18](https://github.com/otakustay/ipc/issues/18)) ([cf574ac](https://github.com/otakustay/ipc/commit/cf574ac18a27ca6c2c70362ee350fe727c698f8b))

## [2.2.0](https://github.com/otakustay/ipc/compare/v2.1.1...v2.2.0) (2024-12-13)


### Features

* add some type utility functions to test if an object is execution message ([d726b39](https://github.com/otakustay/ipc/commit/d726b39a02873b4e32bc5b73c1255e5d0b083ed5))


### Bug Fixes

* update dependency @types/node to v22.10.2 ([#12](https://github.com/otakustay/ipc/issues/12)) ([5bdf1d6](https://github.com/otakustay/ipc/commit/5bdf1d6e7ffbc7c7346f3c269f30bf4ea4860acc))

## [2.1.1](https://github.com/otakustay/ipc/compare/v2.1.0...v2.1.1) (2024-12-11)


### Bug Fixes

* add missing dependency nanoid ([caf60c3](https://github.com/otakustay/ipc/commit/caf60c30d4b554cdb1fc537289b29a99c4f113da))

## [2.1.0](https://github.com/otakustay/ipc/compare/v2.0.0...v2.1.0) (2024-12-11)


### Features

* allow handler to get task id ([e5c3710](https://github.com/otakustay/ipc/commit/e5c3710349ff8bdb3d5b672a9996b142d75f3489))

## [2.0.0](https://github.com/otakustay/ipc/compare/v1.0.1...v2.0.0) (2024-12-11)


### ⚠ BREAKING CHANGES

* `Server` now requires to implement `createContext` method

### Features

* add context to request handler ([f809c49](https://github.com/otakustay/ipc/commit/f809c491587bce2e6e7255b5792eca71e3ff5d9c))

## [1.0.1](https://github.com/otakustay/ipc/compare/v1.0.0...v1.0.1) (2024-12-09)


### Bug Fixes

* export missing modules ([bb1e6da](https://github.com/otakustay/ipc/commit/bb1e6daa698c1ed6104414aafaf789efb0ed3190))

## 1.0.0 (2024-12-09)


### Features

* add a ProcessPort to connect current process ([9f6eb1d](https://github.com/otakustay/ipc/commit/9f6eb1de5854be0be0a57e8992cf38e2d1d5b687))
* implement port, server and client architecture ([a920275](https://github.com/otakustay/ipc/commit/a9202752e4109cfe0b82ddb2cf48d10f28a47bf4))
