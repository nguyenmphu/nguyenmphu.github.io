# Elastic Block Store (EBS)
## Instance Store
Block level storage behave like physical hard drive.

- Temporary block-level storage for EC2 instance
- When the instance is terminated, all data of the instance store is deleted

## Elastic Block Store
Provides persisted block-level storage.

To create an EBS volume, define the configuration (size & type) and provision it. Then attach it to an EC2 instance.

You can take **incremental backups** of EBS volumes by creating Amazon EBS snapshots.
