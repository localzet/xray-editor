import json
import sys
import re

from typing import Iterator, TypedDict


class RawType(TypedDict):
    title: str
    description: str
    raw_properties: list[dict]


class JsonschemaType(TypedDict):
    title: str
    description: str
    # https://github.com/microsoft/monaco-editor/issues/1816
    markdownDescription: str
    properties: dict[str, dict]
    additionalProperties: bool


KNOWN_BAD_RESOLVES = (
    "FakeDnsObject",
    "metricsObject",
    "TransportObject",
    "noiseObject",
    "DnsServerObject",
    "xhttpSettings",
    "PingConfigObject",
    "XHTTP: Beyond REALITY",
    "CostObject",
    "SockoptObject",
)
USED_OBJECTS = set()


def clean_prefix(line: str) -> bool:
    """
    Проверяет, что строка:
      - начинается с '>'
      - если '`' встречается **до** первой ':', между '>' и этой '`' только пробелы;
      - в остальных случаях возвращает True.
    """
    if not line.startswith(">"):
        return False

    body = line[1:]
    idx_tick = body.find("`")
    idx_colon = body.find(":")
    if idx_colon == -1:
        idx_colon = body.find("：")

    if 0 <= idx_tick < idx_colon:
        return all(ch == " " for ch in body[:idx_tick])

    return True


def parse(stdin: Iterator[str]) -> Iterator[JsonschemaType]:
    current_obj: RawType | None = None

    for line in stdin:
        if line.startswith("##"):
            if current_obj:
                description = current_obj["description"]

                yield {
                    "title": current_obj["title"],
                    "description": description,
                    "markdownDescription": description,
                    "properties": {x["name"]: x for x in current_obj["raw_properties"]},
                    # Отключаем additionalProperties, чтобы monaco предупреждал о
                    # неизвестных свойствах. Xray их допускает, но чаще всего это ошибка.
                    # Включаем это только если у нас есть свои свойства, иначе нет смысла.
                    "additionalProperties": not current_obj["raw_properties"],
                }

            current_obj = {
                "title": line.split(" ", 1)[-1].strip(),
                "description": "",
                "raw_properties": [],
            }
        elif line.startswith("> ") and (":" in line or "：" in line) and current_obj:
            if ":" in line:
                name, ty = line[2:].split(":", 1)
            else:
                name, ty = line[2:].split("：", 1)

            if not clean_prefix(line):
                continue

            name = name.strip(" `")

            current_obj["raw_properties"].append(
                {
                    "name": name,
                    "description": "",
                    "markdownDescription": "",
                    **parse_type(ty),
                }
            )
        elif current_obj:
            if current_obj["raw_properties"]:
                current_obj["raw_properties"][-1]["description"] += line
                current_obj["raw_properties"][-1]["markdownDescription"] += line
            else:
                current_obj["description"] += line


def split_top_level(input_str, delimiter="|"):
    parts = []
    current = []
    level_square = 0
    level_paren = 0
    in_quotes = False

    i = 0
    while i < len(input_str):
        c = input_str[i]

        if c == '"' and (i == 0 or input_str[i-1] != '\\'):
            in_quotes = not in_quotes

        elif not in_quotes:
            if c == '[':
                level_square += 1
            elif c == ']':
                if level_square > 0:
                    level_square -= 1
            elif c == '(':
                level_paren += 1
            elif c == ')':
                if level_paren > 0:
                    level_paren -= 1

        if not in_quotes and level_square == 0 and level_paren == 0 and c == delimiter:
            # Разделяем по верхнему уровню
            part = "".join(current).strip()
            parts.append(part)
            current = []
            i += 1
            # Если delimiter - " | " с пробелами, пропускаем пробелы
            while i < len(input_str) and input_str[i] == ' ':
                i += 1
            continue

        current.append(c)
        i += 1

    if current:
        parts.append("".join(current).strip())
    return parts


def parse_type(input: str) -> dict:
    input = (
        input.replace('<Badge text="WIP" type="warning"/>', "")
        .replace('<Badge text="BETA" type="warning"/>', "")
        .replace("<br>", "")
        .strip()
    )

    if not input:
        return {}

    if input.startswith("\\[") and input.endswith("\\]"):
        return {"type": "array", "items": parse_type(input[2:-2])}

    if input.startswith("[") and input.endswith("]"):
        return {"type": "array", "items": parse_type(input[1:-1])}

    if (input.startswith("[") and input.endswith(")")) or input.endswith("Object"):
        name = input.split("]")[0].strip("[]")
        if name in KNOWN_BAD_RESOLVES:
            # Если ссылка неразрешима, редактор monaco отключает все маркеры валидации,
            # так как корневой объект с ошибкой. Поэтому отлавливаем такие случаи
            # и подменяем на object.
            return {"type": "object"}
        else:
            USED_OBJECTS.add(name)
            return {"$ref": f"#/definitions/{name}"}

    m = re.match(r'\[([^\]]+)\]\(#.*\)', input)
    if m:
        name = m.group(1)
        if name in KNOWN_BAD_RESOLVES:
            return {"type": "object"}
        USED_OBJECTS.add(name)
        return {"$ref": f"#/definitions/{name}"}

    if input in ("true", "false", "true | false", "bool"):
        return {"type": "boolean"}

    if " | " in input:
        return {"anyOf": [parse_type(x) for x in input.split(" | ")]}

    if input in ("address", "address_port", "CIDR"):
        return {"type": "string"}

    if input in ("string", "number"):
        return {"type": input}

    if input == "int":
        return {"type": "integer"}

    if input.startswith("map"):
        return {"type": "object"}

    if input.startswith('"') and input.endswith('"'):
        return {"const": input[1:-1]}

    if input.startswith("a list of"):
        return {}

    if input in ("string array", "array"):
        return {"type": "array", "items": {"type": "string"}}

    if input.startswith("string, any of"):
        return {"type": "string"}

    # Вот тут я не уверен
    if input == "object":
        return {}

    if input == "float number":
        return {"type": "number"}

    if re.search(r"[а-яА-Я]", input):
        return {}

    raise Exception(input)


def main():
    root_definition = sys.argv[1]

    definitions = {}
    for definition in parse(sys.stdin):
        key = definition["title"]
        if key in definitions:
            # Обрабатываем повторяющиеся InboundConfigurationObject/OutboundConfigurationObject
            if "anyOf" not in definitions[key]:
                definitions[key] = {"anyOf": [definitions[key]]}
            definitions[key]["anyOf"].append(definition)
        else:
            definitions[key] = definition

    for name in USED_OBJECTS:
        if name not in definitions:
            raise AssertionError(
                f"Не удалось найти {name}, добавьте в KNOWN_BAD_RESOLVES")

    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$ref": f"#/definitions/{root_definition}",
        "definitions": definitions,
    }

    print(json.dumps(schema, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
