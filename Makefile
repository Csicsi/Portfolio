dev:
	docker-compose up dev

prod:
	docker-compose up prod

build-dev:
	docker-compose build dev

build-prod:
	docker-compose build prod

stop:
	docker-compose down

clean:
	docker system prune -f

.PHONY: dev prod build-dev build-prod stop clean
