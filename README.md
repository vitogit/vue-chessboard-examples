# Blockchain Chess Lounge

This is the source code for the Blockchain Chess Lounge, an open-source p2p chess application which settles on the blockchain.

## Project Setup

### Frontend

All you need is to do:

```sh
$ yarn install
$ yarn serve
```

**Build for release**

```sh
$ yarn run build
```

### Contracts

Start a development blockchain:

```sh
$ truffle develop
...
>
```

In another terminal:

```sh
$ truffle migrate
$ truffle test
...
```
