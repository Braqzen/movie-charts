default: build

# -- Docker --
build:
	docker rmi movie-hub-image:latest 2>/dev/null || true
	docker build -t movie-hub-image .

build-site:
	docker rmi movie-hub-website:latest 2>/dev/null || true
	docker build -t movie-hub-website -f website/Dockerfile website

run:
	docker compose up -d
	@echo Website: http://localhost:8080/

stop:
	docker compose down

nuke:
	docker compose down -v

# -- Development --
rbuild:
	cargo build $(cargo metadata --format-version 1 | jq -r '.workspace_members as $wm | .packages[] | select([.id] | inside($wm)) | .name' | sed 's/^/-p /' | tr '\n' ' ')
