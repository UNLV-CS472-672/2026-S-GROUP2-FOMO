import os
import sys

import pytest
from unittest.mock import patch, MagicMock

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from friendRec import user_exists



# Simulate data w/ mock so we don't query actual Convex.
@pytest.fixture(autouse=True)
def mock_client():
    with patch("friendRec.client") as mock:
        yield mock

# Should return true, since this fake data DOES exist in "users"
def test_user_exists_returns_true(mock_client):
    mock_client.query.return_value = {"_id": "randomId", "name": "seed|manjot"}
    result = user_exists("Manjot")
    assert result is True
    mock_client.query.assert_called_once_with("query:user", {"name": "seed|manjot"})

# Should return false, since this fake data DOES NOT exist in "users"
def test_user_exists_returns_false(mock_client):
    mock_client.query.return_value = None
    result = user_exists("gorilla_sushi")
    assert result is False
    mock_client.query.assert_called_once_with("query:user", {"name": "seed|gorilla_sushi"})