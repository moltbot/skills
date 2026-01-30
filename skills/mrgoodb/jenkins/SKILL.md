---
name: jenkins
description: Manage Jenkins jobs, builds, and pipelines via API. Trigger builds and monitor status.
metadata: {"clawdbot":{"emoji":"🔧","requires":{"env":["JENKINS_URL","JENKINS_USER","JENKINS_TOKEN"]}}}
---
# Jenkins
CI/CD automation server.
## Environment
```bash
export JENKINS_URL="https://jenkins.example.com"
export JENKINS_USER="admin"
export JENKINS_TOKEN="xxxxxxxxxx"
```
## List Jobs
```bash
curl -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/api/json?tree=jobs[name,color]"
```
## Trigger Build
```bash
curl -X POST -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/job/{jobName}/build"
```
## Get Build Status
```bash
curl -u "$JENKINS_USER:$JENKINS_TOKEN" "$JENKINS_URL/job/{jobName}/lastBuild/api/json"
```
## Links
- Docs: https://www.jenkins.io/doc/book/using/remote-access-api/
