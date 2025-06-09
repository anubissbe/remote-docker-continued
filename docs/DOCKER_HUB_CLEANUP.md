# Docker Hub Cleanup Instructions

## Tags to Remove from telkombe/remote-docker

The following test/debug tags should be removed from Docker Hub to clean up the repository:

### Test/Debug Tags (Remove these):
- `debug` - Test build from 2025-06-09 13:53:45
- `test` - Test build from 2025-06-09 13:57:40
- `debug-test` - Test build from 2025-06-09 13:58:42
- `fixed` - Test build from 2025-06-09 14:00:15
- `inline-test` - Test build from 2025-06-09 14:04:59
- `minimal` - Test build from 2025-06-09 14:07:03
- `fixed-path` - Test build from 2025-06-09 14:09:18
- `latest` - Currently points to a test build, should be updated to v1.0.9

### Tags to Keep:
- `v1.0.9` - Latest stable version
- `v1.0.8` through `v1.0.1` - Previous versions for rollback capability
- `main` - Development branch

## How to Remove Tags

1. Go to https://hub.docker.com/r/telkombe/remote-docker/tags
2. Login with your Docker Hub account
3. Click on each test/debug tag listed above
4. Click "Delete" for each tag
5. Update `latest` tag to point to `v1.0.9`:
   ```bash
   docker pull telkombe/remote-docker:v1.0.9
   docker tag telkombe/remote-docker:v1.0.9 telkombe/remote-docker:latest
   docker push telkombe/remote-docker:latest
   ```

## Recommended Tag Strategy

Going forward, use these tags:
- `latest` - Always points to the most recent stable version
- `v1.x.x` - Semantic versioning for releases
- `dev` or `beta` - For pre-release testing (delete after stable release)