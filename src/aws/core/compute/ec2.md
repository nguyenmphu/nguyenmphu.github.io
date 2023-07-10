# EC2
Provide you virtual servers to run the applications in the AWS cloud.
## Instance types
AWS docs: [https://aws.amazon.com/ec2/instance-types/](https://aws.amazon.com/ec2/instance-types/)

Instance types are optimized for diffenrent tasks. This might include requirements for compute, memory or storage capabilities.

### General purpose instances

Provide a balance of compute, memory and networking resources. Some usecases:

- application servers
- small & medium databases

Use when the appication does not require optimization in any single resource area.

### Compute optimized instances

Use for compute-bound applications that benefit from high-performance proccessors.

### Memory optimized instances

Use for workloads that proccess large datasets in memory.

### Accelerated computing instances
Use hardware accelerators, or coprocessors, to perform some functions more efficiently than is possible in software running on CPUs. Examples of these functions include floating-point number calculations, graphics processing, and data pattern matching.

### Storage optimized instances

Are designed for workloads that require high, sequential read and write access to large datasets on local storage. Examples of workloads suitable for storage optimized instances include distributed file systems, data warehousing applications, and high-frequency online transaction processing (OLTP) systems.

## Pricing
### On-demand
Use for short-term, irregular workloads that cannot be interrupted. 
Sample use cases: developing and testing applications and running applications that have unpredictable usage patterns.

**Not recommended for workloads that last a year or longer. For this workloads, use Reserved Instances instead.**

### Reserved Instances
Are billing discount for On-demand Instances in your account.
At the end of a Reserved Instance term, you can continue using the Amazon EC2 instance without interruption. However, you are charged On-Demand rates until you do one of the following:

- Terminate the instance.
- Purchase a new Reserved Instance that matches the instance attributes (instance type, Region, tenancy, and platform).

### Saving Plans
Enable you to reduce your compute costs by committing to a consistent amount of compute usage for a 1-year or 3-year term. This term commitment results in savings of up to 72% over On-Demand costs.

### Spot Instances
Are ideal for workloads with flexible start and end times, or that can withstand interruptions. Spot Instances use unused Amazon EC2 computing capacity and offer you cost savings at up to 90% off of On-Demand prices.

### Dedicated Hosts
Are physical servers with Amazon EC2 instance capacity that is fully dedicated to your use.

## Auto Scaling
2 approachs:

- dynamic scaling: response on changing demand
- predictive scaling: automatically schedules the right number of Amazon EC2 instances based on predicted demand

Configure Auto Scaling Group params:

- minimum capacity: number of instances that launch immediately after create Auto Scaling group
- desired capacity: if not set, minimum capcacity
- maximum capacity 
