# Serverless
## Lambda
`AWS Lambda` is the service that lets you run your code without needing to provision or manage servers.

How `Lambda` works:

- Upload code
- Set trigger from an event source
- `Lambda` runs the code when triggered

Pay only the compute time.

### Invocation models
- Synchronous
- Asynchronous
- Polling

### Execution Environment
Life cycle (3 phases):
- Init
- Invoke
- Shutdown

### Performance optimization
- Minimize cold start times: use `provisioned concurrency`.
- Write functions to take advantage of warm starts:
    + store & reference dependencies locally
    + limit re-initialization of variables
    + add code to check for and re-use existing connections
    + use `tmp` space as transient cache
    + check that background processed have completed

### AWS SAM
`AWS SAM` is an application framework that simplifies creation and deployment of your serverless applications.

### Configuring
- Memory
- Timeout