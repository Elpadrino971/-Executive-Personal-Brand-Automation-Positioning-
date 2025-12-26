.PHONY: help install dev build start stop clean migrate logs test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Run in development mode
	npm run dev

build: ## Build TypeScript
	npm run build

start: ## Start with Docker Compose
	docker-compose up -d

stop: ## Stop Docker containers
	docker-compose down

clean: ## Clean build artifacts and containers
	rm -rf dist node_modules
	docker-compose down -v

migrate: ## Run database migrations
	npm run migrate

logs: ## Show Docker logs
	docker-compose logs -f

test: ## Run tests
	npm test

lint: ## Lint code
	npm run lint

docker-build: ## Build Docker image
	docker build -t executive-brand-automation:latest .

docker-push: ## Push Docker image (requires login)
	docker push executive-brand-automation:latest

db-shell: ## Open PostgreSQL shell
	docker exec -it executive-brand-db psql -U user -d executive_brand

redis-cli: ## Open Redis CLI
	docker exec -it executive-brand-redis redis-cli

backup-db: ## Backup database
	docker exec executive-brand-db pg_dump -U user executive_brand > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db: ## Restore database (usage: make restore-db FILE=backup.sql)
	docker exec -i executive-brand-db psql -U user executive_brand < $(FILE)
