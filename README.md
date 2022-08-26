# Comet (Official Pixi Editor)

> NOTE: This readme will be expanded soon

# Local Development

## Install pnpm

This repo uses [pnpm](https://pnpm.io/) to manage and install dependencies.

See the [official documentation](https://pnpm.io/installation) for installation methods.

## Install Dependencies

```
$ pnpm install
```

## Running locally

To build and run the editor in watch mode use:

```
$ pnpm dev
```

Then visit [localhost:3000](http://localhost:3000)

## Git workflow

This repo uses [Commitizen](https://www.npmjs.com/package/commitizen) with [commitlint](https://www.npmjs.com/package/commitlint) to ensure [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) as well as [Husky](https://typicode.github.io/husky/#/) to manage Git hooks.

When you are ready to commit, use the convenience command `./gc` (from repo root) to trigger Commitizen. This command triggers an empty commit message, otherwise the standard Git commit editor will appear after commitizen.

```
$ ./gc
```

You'll then see the commitizen commit wizard appear, complete the commit info as required.