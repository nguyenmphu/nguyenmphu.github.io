# Messaging & Queuing
## SNS (Simple Notification Service)
`SNS` is a publish/subscribe service.
Subscribers can be web servers, email addresses, AWS Lambda functions or serveral other options.

## SQS (Simple Queue Service)
`SQS` allows you storing, sending and receiving messages between software components, without losing messages and requiring other services to be available.
In `SQS`, an application sends messages into the queue, and the other retrives a message from the queue, processes it and deletes it from the queue.
