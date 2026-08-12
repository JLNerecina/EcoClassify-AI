# Contributing to EcoClassify AI

First off, thank you for considering contributing to EcoClassify AI! It's people like you that make this tool better for everyone.

## How Can I Contribute?

### Reporting Bugs
* Ensure the bug was not already reported by searching on GitHub under Issues.
* If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements
* Open a new issue with a clear title and description.
* Explain why this enhancement would be useful.

### Pull Requests
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes by running `npm run build` and checking for TypeScript errors.
4. Make sure your code lints nicely (`npm run lint`).
5. Issue that pull request!

## Code of Conduct
By participating in this project, you are expected to uphold standard open-source codes of conduct. Please be welcoming and respectful to all contributors.

## Development Setup
1. Clone the repo and run `npm install`.
2. Set up your `.env` file with `GEMINI_API_KEY` and `ROBOFLOW_API_KEY` by referencing `.env.example`.
3. Start the dev server with `npm run dev`.
