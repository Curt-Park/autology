.PHONY: all check format format-check lint lint-fix typecheck test test-coverage build clean

all: check

check: format-check lint typecheck test

format:
	npm run format

format-check:
	npm run format:check

lint:
	npm run lint

lint-fix:
	npx eslint . --ext .ts,.tsx --fix

typecheck:
	npm run typecheck

test:
	npm run test

test-coverage:
	npm run test --workspace=@autology/mcp-server -- --coverage

build:
	npm run build

clean:
	rm -rf packages/*/dist
