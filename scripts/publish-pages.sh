#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

if [[ $# != 2 || ! $1 =~ ^TanemTech/[A-Za-z0-9_.-]+$ || ! $2 =~ ^[a-f0-9]{40}$ ]]; then
  fail 'Укажите клиентский репозиторий и проверенный коммит: bash scripts/publish-pages.sh TanemTech/REPO COMMIT_SHA'
fi

repository=$1
commit=$2
[[ -n ${TANEM_PAGES_TOKEN:-} ]] || fail 'Подключите сетевой секрет TANEM_PAGES_TOKEN для api.github.com по DEPLOYMENT.md.'
command -v jq >/dev/null || fail 'Для публикации требуется jq.'

response=$(mktemp)
trap 'rm -f "$response"' EXIT

api() {
  local method=$1 path=$2
  shift 2
  status=$(printf 'Authorization: Bearer %s\n' "$TANEM_PAGES_TOKEN" |
    curl -q --silent --show-error --max-time 30 --request "$method" --header @- \
      --header 'Accept: application/vnd.github+json' \
      --header 'Content-Type: application/json' \
      --header 'X-GitHub-Api-Version: 2026-03-10' \
      --output "$response" --write-out '%{http_code}' "$@" \
      "https://api.github.com/repos/$repository/$path") ||
    fail "Ошибка соединения с GitHub при $method $path"
}

expect() {
  local expected=$1 stage=$2
  if [[ $status != "$expected" ]]; then
    local message
    message=$(jq -r '.message // empty' "$response" 2>/dev/null) || message=
    fail "$stage — HTTP $status. $message"
  fi
}

case "${repository,,}" in
  tanemtech/copy-tanem-salons-template|tanemtech/copy-tanem-masters-template)
    fail 'Укажите репозиторий собранного клиентского сайта.'
    ;;
esac

api GET git/ref/heads/main
expect 200 'Проверка ветки main'
[[ $(jq -r '.object.sha' "$response") == "$commit" ]] ||
  fail 'В main находится другой коммит. Сначала проверьте актуальную сборку.'

for attempt in {1..6}; do
  api GET actions/workflows/pages.yml
  [[ $status != 404 || $attempt == 6 ]] && break
  sleep 5
done
expect 200 'Проверка Pages workflow'
[[ $(jq -r '.state' "$response") == active ]] ||
  fail 'Workflow pages.yml должен быть активен.'

api GET pages
if [[ $status == 404 ]]; then
  api POST pages --data '{"build_type":"workflow"}'
  if [[ $status == 409 || $status == 422 ]]; then
    # A concurrent run may have already created the Pages site.
    creation_status=$status
    creation_message=$(jq -r '.message // empty' "$response")
    api GET pages
    [[ $status == 200 ]] ||
      fail "Включение GitHub Pages — HTTP $creation_status. $creation_message"
  else
    expect 201 'Включение GitHub Pages'
  fi
else
  expect 200 'Проверка настроек GitHub Pages'
fi

[[ -z $(jq -r '.cname // empty' "$response") ]] ||
  fail 'У сайта подключён собственный домен. Для превью нужен репозиторий без собственного домена.'

if [[ $(jq -r '.build_type' "$response") != workflow ]]; then
  api PUT pages --data '{"build_type":"workflow"}'
  expect 204 'Переключение Pages на GitHub Actions'
fi

api POST actions/workflows/pages.yml/dispatches --data '{"ref":"main"}'
expect 200 'Запуск Pages workflow'
run_id=$(jq -er '.workflow_run_id | select(type == "number")' "$response") ||
  fail 'GitHub не вернул идентификатор запуска Pages.'
run_url=$(jq -er '.html_url | strings | select(length > 0)' "$response")
printf 'GitHub Actions — %s\n' "$run_url" >&2

deadline=$((SECONDS + 1200))
while (( SECONDS < deadline )); do
  api GET "actions/runs/$run_id"
  if [[ $status != 404 ]]; then
    expect 200 'Проверка запуска GitHub Actions'
    [[ $(jq -r '.head_sha' "$response") == "$commit" ]] ||
      fail 'GitHub Actions запустился для другого коммита.'
    if [[ $(jq -r '.status' "$response") == completed ]]; then
      conclusion=$(jq -r '.conclusion' "$response")
      [[ $conclusion == success ]] || fail "Запуск GitHub Actions завершился со статусом $conclusion."
      break
    fi
  fi
  sleep 10
done
[[ ${conclusion:-} == success ]] || fail 'Публикация всё ещё выполняется. Проверьте запуск GitHub Actions.'

api GET "actions/runs/$run_id/jobs"
expect 200 'Проверка этапа публикации'
jq -e 'any(.jobs[]; .name == "deploy" and .conclusion == "success")' "$response" >/dev/null ||
  fail 'Этап deploy не завершился успешно.'

api GET pages
expect 200 'Получение адреса GitHub Pages'
page_url=$(jq -er '.html_url | strings | select(test("^https://tanemtech\\.github\\.io/"; "i"))' "$response") ||
  fail 'GitHub не вернул адрес превью на tanemtech.github.io.'
curl -q --fail --silent --show-error --max-time 15 --location --proto '=https' --proto-redir '=https' \
  --retry 10 --retry-all-errors --retry-delay 5 --retry-max-time 75 --output /dev/null "$page_url" ||
  fail "Ссылка GitHub Pages пока не открывается — $page_url"

jq -n --arg page_url "$page_url" --arg actions_url "$run_url" --arg commit "$commit" \
  '{page_url: $page_url, actions_url: $actions_url, commit: $commit}'
