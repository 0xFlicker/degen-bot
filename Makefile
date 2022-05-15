.PHONY: build-RuntimeDependenciesLayer build-lambda-common
.PHONY: secrets

build-DiscordFunction:
	$(MAKE) build-lambda-common
	$(MAKE) build-RuntimeDependenciesLayer

build-lambda-common:
	yarn build
	cp -r lib "$(ARTIFACTS_DIR)/"

build-RuntimeDependenciesLayer:
	# mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json yarn.lock "$(ARTIFACTS_DIR)/"
	yarn --production --cwd "$(ARTIFACTS_DIR)/"
	# rm "$(ARTIFACTS_DIR)/package.json" # to avoid rebuilding when changes doesn't relate to dependencies

update-secrets:
	@aws secretsmanager update-secret --secret-id "degen-bot-secrets" --secret-string '$(shell sops --decrypt secrets/degen-bot-secrets.json)'
create-secrets:
	@aws secretsmanager create-secret --name "degen-bot-secrets" --secret-string '$(shell sops --decrypt secrets/degen-bot-secrets.json)'
