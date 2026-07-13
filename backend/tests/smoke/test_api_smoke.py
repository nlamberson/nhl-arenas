"""Pytest entry point for live API smoke tests."""

import pytest

from tests.smoke.runner import SmokeTestError, load_config_from_env, run_smoke_tests

pytestmark = pytest.mark.smoke


def _smoke_env_configured() -> bool:
    try:
        load_config_from_env()
        return True
    except SmokeTestError:
        return False


@pytest.mark.skipif(
    not _smoke_env_configured(),
    reason="SMOKE_TEST_API_URL, SMOKE_TEST_EMAIL, and SMOKE_TEST_PASSWORD must be set",
)
def test_weekly_api_smoke() -> None:
    result = run_smoke_tests()
    assert result.visits_created == result.iterations
    assert result.visits_deleted == result.visits_created
    assert result.total_duration_sec > 0
