"""Deploy a verified backend commit to a preconfigured DigitalOcean App Platform app.

This script is only invoked by the gated deployment jobs in backend-ci.yml.
It uses Python's standard library and never logs the API token.
"""
from __future__ import annotations

import json
import os
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

API = "https://api.digitalocean.com/v2/apps"
POLL_SECONDS = 15
TIMEOUT_SECONDS = 20 * 60
FAILURE_PHASES = {"ERROR", "CANCELED", "SUPERSEDED"}


def required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required deployment configuration: {name}")
    return value


def request(url: str, token: str, *, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode() if payload is not None else None
    req = Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        method="POST" if payload is not None else "GET",
    )
    try:
        with urlopen(req, timeout=30) as response:
            return json.load(response)
    except HTTPError as exc:
        raise RuntimeError(f"DigitalOcean API returned HTTP {exc.code}") from exc
    except (URLError, TimeoutError) as exc:
        raise RuntimeError("DigitalOcean API request failed") from exc


def main() -> None:
    token = required("DO_API_TOKEN")
    app_id = required("DO_APP_ID")
    service_name = required("DO_SERVICE_NAME")
    repository = required("GITHUB_REPOSITORY")
    branch = required("GITHUB_REF_NAME")
    expected_sha = required("GITHUB_SHA")
    url = f"{API}/{app_id}"

    app = request(url, token)["app"]
    services = app.get("spec", {}).get("services", [])
    service = next((item for item in services if item.get("name") == service_name), None)
    if service is None:
        raise RuntimeError(f"Backend service {service_name!r} is absent from the app spec")
    source = service.get("github", {})
    if source.get("repo") != repository or source.get("branch") != branch:
        raise RuntimeError("App source repository/branch does not match the verified push")
    if service.get("source_dir", "").strip("/") != "backend":
        raise RuntimeError("App backend service must use /backend as its source directory")

    deployment = request(f"{url}/deployments", token, payload={"force_build": True})[
        "deployment"
    ]
    deployment_id = deployment["id"]
    print(f"Started backend deployment {deployment_id}", flush=True)

    deadline = time.monotonic() + TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        deployment = request(f"{url}/deployments/{deployment_id}", token)["deployment"]
        phase = deployment.get("phase", "UNKNOWN")
        print(f"Deployment {deployment_id}: {phase}", flush=True)
        if phase == "ACTIVE":
            deployed = next(
                (item for item in deployment.get("services", []) if item.get("name") == service_name),
                None,
            )
            if deployed is None or deployed.get("source_commit_hash") != expected_sha:
                raise RuntimeError("Active deployment did not use the verified commit")
            print(f"Backend deployment is active at {expected_sha}")
            return
        if phase in FAILURE_PHASES:
            raise RuntimeError(f"Backend deployment ended in phase {phase}")
        time.sleep(POLL_SECONDS)
    raise RuntimeError("Backend deployment did not become active within 20 minutes")


if __name__ == "__main__":
    try:
        main()
    except (KeyError, RuntimeError) as exc:
        print(f"Deployment failed: {exc}", file=sys.stderr)
        sys.exit(1)
