"""Pytest entry point for live keep-alive smoke tests."""

import pytest

from tests.smoke.keepalive import KeepaliveError, load_config_from_env, run_keepalive_smoke

pytestmark = pytest.mark.smoke


def _smoke_env_configured() -> bool:
    try:
        load_config_from_env()
        return True
    except KeepaliveError:
        return False


@pytest.mark.skipif(
    not _smoke_env_configured(),
    reason="KEEPALIVE_API_URL, KEEPALIVE_EMAIL, and KEEPALIVE_PASSWORD must be set",
)
def test_weekly_keepalive_smoke() -> None:
    result = run_keepalive_smoke()
    assert result.visits_created == result.iterations
    assert result.visits_deleted == result.visits_created
    assert result.total_duration_sec > 0
