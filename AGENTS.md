# Repository Guidelines

## Project Structure & Module Organization

This repository is currently an empty scaffold. As implementation is added, keep production code in `src/`, tests in `test/` or beside source files as `*.test.js`, and static fixtures in `test/fixtures/`. Organize `src/` by responsibility rather than file type, for example `src/proxy/`, `src/config/`, and `src/http/`. Keep entry points thin and place business rules in independently testable modules.

## Build, Test, and Development Commands

No build system or package scripts exist yet. When bootstrapping the project, expose the standard workflow through `package.json` and document any required environment variables in `.env.example`.

- `npm install` installs locked dependencies.
- `npm run dev` starts the local development server with reload support.
- `npm test` runs the complete automated test suite.
- `npm run lint` checks code quality and formatting.
- `npm run build` creates production artifacts in `dist/`, if compilation is required.

Do not commit generated output, dependency directories, or local `.env` files.

## Coding Style & Naming Conventions

Use clean, focused modules and avoid duplicated logic. Prefer two-space indentation for JavaScript or TypeScript. Use `camelCase` for variables and functions, `PascalCase` for classes and exported types, and `kebab-case` for filenames such as `request-forwarder.js`. Keep functions small, use explicit names, and separate transport, configuration, and domain concerns. Configure ESLint and Prettier when source code is introduced; run both before submitting changes.

## Testing Guidelines

Add tests with every behavior change and bug fix. Do not weaken or remove assertions to make a change pass. Name tests after observable behavior, for example `request-forwarder.test.js`. Cover success paths, validation failures, upstream errors, and timeout behavior. Keep tests deterministic and isolate network calls with controlled fixtures or test servers.

## Commit & Pull Request Guidelines

There is no Git history from which to infer an existing convention. Use concise, imperative commit subjects, optionally following Conventional Commits, such as `feat: add proxy health check` or `fix: preserve upstream status code`.

Pull requests should explain the problem and solution, list verification commands, and link related issues. Include configuration notes and sample requests for API changes; include screenshots only for user-visible changes. Keep each pull request narrowly scoped and ensure all tests and lint checks pass.

## Security & Configuration

Never commit API keys, tokens, or credentials. Validate inbound URLs and headers, define request size and timeout limits, and avoid logging secrets. Provide safe defaults and fail clearly when required configuration is missing.
