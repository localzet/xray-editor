build: main.wasm wasm_exec.js xray.schema.json
	mkdir -p ../public
	mv main.wasm wasm_exec.js xray.schema.json ../public/
.PHONY: build

dev-lite:
	wget -nc https://localzet.github.io/xray-editor/main.wasm
	wget -nc https://localzet.github.io/xray-editor/wasm_exec.js
	wget -nc https://localzet.github.io/xray-editor/xray.schema.json
.PHONY: build-lite

assets/xray-patched: xray-version.txt
	rm -rf assets/xray-core assets/xray-patched
	mkdir -p assets
	cd assets && \
		git clone https://github.com/xtls/xray-core && \
		cd xray-core && \
		git checkout -f $$(cat ../../xray-version.txt)
	cat xray-wasm.patch | (cd assets/xray-core && git apply)
	mv assets/xray-core assets/xray-patched

assets/geoip.dat:
	mkdir -p assets
	cd assets && wget https://github.com/v2fly/geoip/releases/latest/download/geoip.dat

assets/geosite.dat:
	mkdir -p assets
	cd assets && wget https://github.com/v2fly/domain-list-community/releases/latest/download/dlc.dat -O geosite.dat

wasm_exec.js:
	mkdir -p .wasm
	curl -o .wasm/wasm_exec.js https://raw.githubusercontent.com/golang/go/refs/heads/master/lib/wasm/wasm_exec.js
	cp .wasm/wasm_exec.js .

main.wasm: assets/geoip.dat assets/geosite.dat assets/xray-patched main.go go.mod xray-wasm.patch
	GOARCH=wasm GOOS=js go build -o main.wasm main.go

assets/Xray-docs-next-main:
	mkdir -p assets
	cd assets && curl -fL https://github.com/XTLS/Xray-docs-next/archive/refs/heads/main.tar.gz | tar xvzf -

xray.schema.json: assets/Xray-docs-next-main
	grep -rI '' assets/Xray-docs-next-main/docs/ru/config/ \
		| cut -d: -f2- \
		| PYTHONUNBUFFERED=1 \
		python3 scrape-docs.py "Основные модули конфигурации" \
		> xray.schema.json