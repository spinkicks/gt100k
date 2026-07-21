output "organization_account_ids" {
  value = module.organization.account_ids
}

output "reserved_boundary_ou_ids" {
  value = module.organization.boundary_ou_ids
}

output "core_runtime" {
  value = {
    vpc_id               = module.network.vpc_id
    eks_cluster_arn      = module.cluster.cluster_arn
    database_instance_id = module.database.instance_id
  }
}

output "identity_data" {
  value = {
    kms_key_arn = module.identity_storage.kms_key_arn
    bucket_ids  = module.identity_storage.bucket_ids
  }
}

output "workload_role_arns" {
  value = module.workload_irsa.role_arns
}
