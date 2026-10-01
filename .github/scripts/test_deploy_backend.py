"""Unit checks for the dormant deployment gate; no API calls are made."""
import os
import unittest
from unittest.mock import patch

import deploy_backend


class BackendDeploymentTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {
            "DO_API_TOKEN": "test-token",
            "DO_APP_ID": "test-app",
            "DO_SERVICE_NAME": "api",
            "GITHUB_REPOSITORY": "owner/SkillBridge",
            "GITHUB_REF_NAME": "main",
            "GITHUB_SHA": "a" * 40,
        })
        self.env.start()
        self.addCleanup(self.env.stop)

    def test_verified_source_and_commit_succeed(self):
        responses = [
            {"app": {"spec": {"services": [{
                "name": "api", "github": {"repo": "owner/SkillBridge", "branch": "main"},
                "source_dir": "/backend",
            }]}}},
            {"deployment": {"id": "deployment-1"}},
            {"deployment": {"id": "deployment-1", "phase": "ACTIVE", "services": [{
                "name": "api", "source_commit_hash": "a" * 40,
            }]}},
        ]
        with patch.object(deploy_backend, "request", side_effect=responses) as api:
            deploy_backend.main()
        self.assertEqual(api.call_count, 3)

    def test_wrong_source_branch_stops_before_deploy(self):
        app = {"app": {"spec": {"services": [{
            "name": "api", "github": {"repo": "owner/SkillBridge", "branch": "develop"},
            "source_dir": "/backend",
        }]}}}
        with patch.object(deploy_backend, "request", return_value=app) as api:
            with self.assertRaisesRegex(RuntimeError, "source repository/branch"):
                deploy_backend.main()
        api.assert_called_once()

    def test_wrong_deployed_commit_fails(self):
        responses = [
            {"app": {"spec": {"services": [{
                "name": "api", "github": {"repo": "owner/SkillBridge", "branch": "main"},
                "source_dir": "/backend",
            }]}}},
            {"deployment": {"id": "deployment-1"}},
            {"deployment": {"id": "deployment-1", "phase": "ACTIVE", "services": [{
                "name": "api", "source_commit_hash": "b" * 40,
            }]}},
        ]
        with patch.object(deploy_backend, "request", side_effect=responses):
            with self.assertRaisesRegex(RuntimeError, "verified commit"):
                deploy_backend.main()


if __name__ == "__main__":
    unittest.main()
