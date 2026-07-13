"""
Weekly keep-alive smoke test against a live NHL Arenas API deployment.

Exercises auth, reference data, and full visit CRUD to keep Supabase/Render active
and catch regressions in production.

Required environment variables:
  KEEPALIVE_API_URL   Base API URL (no trailing slash), e.g. https://api.example.com
  KEEPALIVE_EMAIL     Dedicated Firebase test user email
  KEEPALIVE_PASSWORD  Password for the test user

Optional:
  KEEPALIVE_ITERATIONS  Number of create/read/update cycles (default: 10)
  KEEPALIVE_HEALTH_RETRIES  Health-check attempts while waking cold starts (default: 12)
  KEEPALIVE_HEALTH_DELAY_SEC  Seconds between health retries (default: 15)
"""

from __future__ import annotations

import logging
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any
from uuid import UUID

import httpx

logger = logging.getLogger(__name__)

DEFAULT_ITERATIONS = 10
DEFAULT_HEALTH_RETRIES = 12
DEFAULT_HEALTH_DELAY_SEC = 15
REQUEST_TIMEOUT_SEC = 120.0


class KeepaliveError(Exception):
    """Raised when a keep-alive smoke step fails."""


@dataclass
class KeepaliveConfig:
    api_url: str
    email: str
    password: str
    iterations: int = DEFAULT_ITERATIONS
    health_retries: int = DEFAULT_HEALTH_RETRIES
    health_delay_sec: int = DEFAULT_HEALTH_DELAY_SEC


@dataclass
class KeepaliveResult:
    """Summary returned after a successful run (useful for future perf baselines)."""

    iterations: int
    visits_created: int
    visits_deleted: int
    total_duration_sec: float
    step_timings_sec: dict[str, float] = field(default_factory=dict)


def load_config_from_env() -> KeepaliveConfig:
    api_url = os.environ.get("KEEPALIVE_API_URL", "").rstrip("/")
    email = os.environ.get("KEEPALIVE_EMAIL", "")
    password = os.environ.get("KEEPALIVE_PASSWORD", "")

    missing = [
        name
        for name, value in [
            ("KEEPALIVE_API_URL", api_url),
            ("KEEPALIVE_EMAIL", email),
            ("KEEPALIVE_PASSWORD", password),
        ]
        if not value
    ]
    if missing:
        raise KeepaliveError(
            f"Missing required environment variable(s): {', '.join(missing)}"
        )

    iterations = int(os.environ.get("KEEPALIVE_ITERATIONS", DEFAULT_ITERATIONS))
    health_retries = int(
        os.environ.get("KEEPALIVE_HEALTH_RETRIES", DEFAULT_HEALTH_RETRIES)
    )
    health_delay_sec = int(
        os.environ.get("KEEPALIVE_HEALTH_DELAY_SEC", DEFAULT_HEALTH_DELAY_SEC)
    )

    if iterations < 1:
        raise KeepaliveError("KEEPALIVE_ITERATIONS must be at least 1")

    return KeepaliveConfig(
        api_url=api_url,
        email=email,
        password=password,
        iterations=iterations,
        health_retries=health_retries,
        health_delay_sec=health_delay_sec,
    )


def _auth_headers(id_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {id_token}"}


def _raise_for_status(response: httpx.Response, context: str) -> None:
    if response.is_success:
        return
    detail = response.text[:500] if response.text else response.reason_phrase
    raise KeepaliveError(f"{context}: HTTP {response.status_code} — {detail}")


def wait_for_health(client: httpx.Client, config: KeepaliveConfig) -> None:
    url = f"{config.api_url}/health/"
    last_error: Exception | None = None

    for attempt in range(1, config.health_retries + 1):
        try:
            response = client.get(url)
            _raise_for_status(response, "Health check")
            payload = response.json()
            if payload.get("status") != "ok":
                raise KeepaliveError(f"Health check returned unexpected payload: {payload}")
            logger.info("Health check passed (attempt %s/%s)", attempt, config.health_retries)
            return
        except (httpx.HTTPError, KeepaliveError) as exc:
            last_error = exc
            if attempt == config.health_retries:
                break
            logger.warning(
                "Health check attempt %s/%s failed (%s); retrying in %ss",
                attempt,
                config.health_retries,
                exc,
                config.health_delay_sec,
            )
            time.sleep(config.health_delay_sec)

    raise KeepaliveError(
        f"API did not become healthy after {config.health_retries} attempts"
    ) from last_error


def login(client: httpx.Client, config: KeepaliveConfig) -> str:
    response = client.post(
        f"{config.api_url}/api/v1/auth/login",
        json={"email": config.email, "password": config.password},
    )
    _raise_for_status(response, "Login")
    data = response.json()
    id_token = data.get("id_token")
    if not id_token:
        raise KeepaliveError("Login response missing id_token")
    return id_token


def fetch_reference_ids(client: httpx.Client, config: KeepaliveConfig) -> tuple[UUID, UUID, UUID]:
    teams_response = client.get(f"{config.api_url}/api/v1/reference/teams")
    _raise_for_status(teams_response, "List teams")
    teams: list[dict[str, Any]] = teams_response.json()
    if len(teams) < 2:
        raise KeepaliveError("Need at least two teams in reference data")

    home_team = teams[0]
    away_team = next((team for team in teams[1:] if team["id"] != home_team["id"]), None)
    if away_team is None:
        raise KeepaliveError("Could not find two distinct teams")

    arenas_response = client.get(f"{config.api_url}/api/v1/reference/arenas")
    _raise_for_status(arenas_response, "List arenas")
    arenas: list[dict[str, Any]] = arenas_response.json()
    if not arenas:
        raise KeepaliveError("Need at least one arena in reference data")

    arena_id = home_team.get("arena_id") or arenas[0]["id"]

    return UUID(home_team["id"]), UUID(away_team["id"]), UUID(arena_id)


def create_visit(
    client: httpx.Client,
    config: KeepaliveConfig,
    headers: dict[str, str],
    *,
    home_team_id: UUID,
    away_team_id: UUID,
    arena_id: UUID,
    visit_date: date,
    seating_location: str,
) -> UUID:
    response = client.post(
        f"{config.api_url}/api/v1/visits",
        headers=headers,
        json={
            "home_team_id": str(home_team_id),
            "away_team_id": str(away_team_id),
            "arena_id": str(arena_id),
            "visit_date": visit_date.isoformat(),
            "seating_location": seating_location,
        },
    )
    _raise_for_status(response, "Create visit")
    visit_id = response.json().get("id")
    if not visit_id:
        raise KeepaliveError("Create visit response missing id")
    return UUID(visit_id)


def get_visit(
    client: httpx.Client,
    config: KeepaliveConfig,
    headers: dict[str, str],
    visit_id: UUID,
) -> dict[str, Any]:
    response = client.get(
        f"{config.api_url}/api/v1/visits/{visit_id}",
        headers=headers,
    )
    _raise_for_status(response, f"Get visit {visit_id}")
    return response.json()


def list_visits_contains(
    client: httpx.Client,
    config: KeepaliveConfig,
    headers: dict[str, str],
    visit_id: UUID,
) -> None:
    response = client.get(
        f"{config.api_url}/api/v1/visits",
        headers=headers,
        params={"limit": 100},
    )
    _raise_for_status(response, "List visits")
    visits: list[dict[str, Any]] = response.json()
    if not any(UUID(visit["id"]) == visit_id for visit in visits):
        raise KeepaliveError(f"Visit {visit_id} not found in paginated list")


def update_visit(
    client: httpx.Client,
    config: KeepaliveConfig,
    headers: dict[str, str],
    visit_id: UUID,
    seating_location: str,
) -> dict[str, Any]:
    response = client.patch(
        f"{config.api_url}/api/v1/visits/{visit_id}",
        headers=headers,
        json={"seating_location": seating_location},
    )
    _raise_for_status(response, f"Update visit {visit_id}")
    payload = response.json()
    if payload.get("seating_location") != seating_location:
        raise KeepaliveError(
            f"Visit {visit_id} seating_location not updated (got {payload.get('seating_location')!r})"
        )
    return payload


def delete_visit(
    client: httpx.Client,
    config: KeepaliveConfig,
    headers: dict[str, str],
    visit_id: UUID,
) -> None:
    response = client.delete(
        f"{config.api_url}/api/v1/visits/{visit_id}",
        headers=headers,
    )
    _raise_for_status(response, f"Delete visit {visit_id}")


def cleanup_visits(
    client: httpx.Client,
    config: KeepaliveConfig,
    headers: dict[str, str],
    visit_ids: list[UUID],
) -> int:
    deleted = 0
    for visit_id in visit_ids:
        try:
            delete_visit(client, config, headers, visit_id)
            deleted += 1
        except KeepaliveError as exc:
            logger.warning("Cleanup delete failed for %s: %s", visit_id, exc)
    return deleted


def run_keepalive_smoke(config: KeepaliveConfig | None = None) -> KeepaliveResult:
    config = config or load_config_from_env()
    started = time.perf_counter()
    step_timings: dict[str, float] = {}
    created_visit_ids: list[UUID] = []

    with httpx.Client(timeout=REQUEST_TIMEOUT_SEC, follow_redirects=True) as client:
        step_start = time.perf_counter()
        wait_for_health(client, config)
        step_timings["health"] = time.perf_counter() - step_start

        step_start = time.perf_counter()
        id_token = login(client, config)
        headers = _auth_headers(id_token)
        step_timings["login"] = time.perf_counter() - step_start

        step_start = time.perf_counter()
        me_response = client.get(f"{config.api_url}/api/v1/auth/me", headers=headers)
        _raise_for_status(me_response, "Get current user")
        step_timings["auth_me"] = time.perf_counter() - step_start

        step_start = time.perf_counter()
        stats_response = client.get(
            f"{config.api_url}/api/v1/visits/stats", headers=headers
        )
        _raise_for_status(stats_response, "Get visit stats")
        step_timings["stats_before"] = time.perf_counter() - step_start

        step_start = time.perf_counter()
        home_team_id, away_team_id, arena_id = fetch_reference_ids(client, config)
        step_timings["reference"] = time.perf_counter() - step_start

        iteration_timings: list[float] = []
        base_date = date.today() - timedelta(days=365)

        try:
            for index in range(config.iterations):
                iter_start = time.perf_counter()
                visit_date = base_date + timedelta(days=index)
                create_seating = f"keepalive-{index}-create"
                update_seating = f"keepalive-{index}-updated"

                visit_id = create_visit(
                    client,
                    config,
                    headers,
                    home_team_id=home_team_id,
                    away_team_id=away_team_id,
                    arena_id=arena_id,
                    visit_date=visit_date,
                    seating_location=create_seating,
                )
                created_visit_ids.append(visit_id)

                visit = get_visit(client, config, headers, visit_id)
                if UUID(visit["id"]) != visit_id:
                    raise KeepaliveError("Retrieved visit id mismatch")
                if visit.get("seating_location") != create_seating:
                    raise KeepaliveError("Retrieved visit seating_location mismatch")

                list_visits_contains(client, config, headers, visit_id)
                update_visit(client, config, headers, visit_id, update_seating)
                get_visit(client, config, headers, visit_id)

                iteration_timings.append(time.perf_counter() - iter_start)
                logger.info(
                    "Iteration %s/%s complete (visit_id=%s, %.2fs)",
                    index + 1,
                    config.iterations,
                    visit_id,
                    iteration_timings[-1],
                )

            step_timings["iterations_total"] = sum(iteration_timings)
            step_timings["iteration_avg"] = (
                step_timings["iterations_total"] / config.iterations
            )

            step_start = time.perf_counter()
            latest_response = client.get(
                f"{config.api_url}/api/v1/visits/latest", headers=headers
            )
            _raise_for_status(latest_response, "Get latest visit")
            step_timings["latest"] = time.perf_counter() - step_start
        finally:
            step_start = time.perf_counter()
            deleted = cleanup_visits(client, config, headers, created_visit_ids)
            step_timings["cleanup"] = time.perf_counter() - step_start

            if deleted != len(created_visit_ids):
                raise KeepaliveError(
                    f"Cleanup incomplete: deleted {deleted}/{len(created_visit_ids)} visits"
                )

            list_response = client.get(
                f"{config.api_url}/api/v1/visits",
                headers=headers,
                params={"limit": 100},
            )
            _raise_for_status(list_response, "Verify cleanup via list visits")
            remaining_ids = {UUID(visit["id"]) for visit in list_response.json()}
            leaked = [vid for vid in created_visit_ids if vid in remaining_ids]
            if leaked:
                raise KeepaliveError(
                    f"Cleanup verification failed; visits still present: {leaked}"
                )

    total_duration = time.perf_counter() - started
    result = KeepaliveResult(
        iterations=config.iterations,
        visits_created=len(created_visit_ids),
        visits_deleted=deleted,
        total_duration_sec=total_duration,
        step_timings_sec=step_timings,
    )
    logger.info(
        "Keep-alive smoke passed: %s iterations, %.2fs total, timings=%s",
        result.iterations,
        result.total_duration_sec,
        result.step_timings_sec,
    )
    return result


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    try:
        result = run_keepalive_smoke()
    except KeepaliveError as exc:
        logger.error("Keep-alive smoke failed: %s", exc)
        return 1

    print(
        f"OK: {result.visits_created} visits exercised in {result.total_duration_sec:.1f}s"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
