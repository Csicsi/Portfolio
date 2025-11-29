IMAGE=dcsicsak/portfolio
TAG=latest

build:
	docker compose build

push:
	docker push $(IMAGE):$(TAG)

compose-up:
	docker compose up --build -d

compose-down:
	docker compose down

deploy: build push

clean:
	docker compose down --rmi local

re: clean compose-up

help:
	@echo "Makefile commands:"
	@echo "  build        - Build the Docker image"
	@echo "  push         - Push the Docker image to the registry"
	@echo "  compose-up   - Start services using Docker Compose"
	@echo "  compose-down - Stop services using Docker Compose"
	@echo "  deploy       - Build and push the Docker image"
	@echo "  clean        - Remove the Docker image"
	@echo "  re           - Clean and restart services"
	@echo "  help         - Show this help message"

.phony: build push compose-up compose-down deploy clean re help