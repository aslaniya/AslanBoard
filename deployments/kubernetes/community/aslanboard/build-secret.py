#!/usr/bin/env python3
"""Turn a Plane plane.env file into the Kubernetes secret env file.

DATABASE_URL and AMQP_URL are blank in the VM env file. Compose fills them
from the password fields, and this script does the same. Writes the result
to the path given as the second argument and prints only key names.
"""

import sys
from pathlib import Path
from urllib.parse import quote


def parse_env(text: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in text.splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key] = value
    return values


def main() -> None:
    source = parse_env(Path(sys.argv[1]).read_text())
    postgres_password = source.get("POSTGRES_PASSWORD", "")
    rabbit_password = source.get("RABBITMQ_PASSWORD", "")
    postgres_user = source.get("POSTGRES_USER") or "plane"
    postgres_db = source.get("POSTGRES_DB") or "plane"
    rabbit_user = source.get("RABBITMQ_USER") or "plane"
    rabbit_vhost = source.get("RABBITMQ_VHOST") or "plane"
    secret = {
        "POSTGRES_PASSWORD": postgres_password,
        "RABBITMQ_PASSWORD": rabbit_password,
        "RABBITMQ_DEFAULT_PASS": rabbit_password,
        "SECRET_KEY": source.get("SECRET_KEY", ""),
        "LIVE_SERVER_SECRET_KEY": source.get("LIVE_SERVER_SECRET_KEY", ""),
        "AWS_ACCESS_KEY_ID": source.get("AWS_ACCESS_KEY_ID", ""),
        "AWS_SECRET_ACCESS_KEY": source.get("AWS_SECRET_ACCESS_KEY", ""),
        "DATABASE_URL": (
            f"postgresql://{quote(postgres_user, safe='')}:"
            f"{quote(postgres_password, safe='')}@plane-db/{postgres_db}"
        ),
        "AMQP_URL": (
            f"amqp://{quote(rabbit_user, safe='')}:"
            f"{quote(rabbit_password, safe='')}@plane-mq:5672/"
            f"{quote(rabbit_vhost, safe='')}"
        ),
    }
    missing = [key for key, value in secret.items() if not value]
    if missing:
        raise SystemExit("missing values: " + ",".join(missing))
    Path(sys.argv[2]).write_text("".join(f"{key}={value}\n" for key, value in secret.items()))
    print("wrote", " ".join(secret))


if __name__ == "__main__":
    main()
