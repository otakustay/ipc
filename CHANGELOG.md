# Changelog

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
