module "organization" {
  source = "../../modules/bootstrap-org"

  providers = { aws = aws.organization }

  org_email_domain      = var.org_email_domain
  core_account_name     = var.core_account_name
  identity_account_name = var.identity_account_name
}

module "network" {
  source = "../../modules/network-vpc"

  providers = { aws = aws.core }

  aws_region = var.aws_region
  name       = "gt100k-dev"
}

module "identity_storage" {
  source = "../../modules/s3-kms"

  providers = { aws = aws.identity }

  name_prefix = "gt100k-dev"
}

module "eks_base_iam" {
  source = "../../modules/iam"

  providers = { aws = aws.core }

  name_prefix      = "gt100k-dev"
  create_eks_roles = true
}

module "cluster" {
  source = "../../modules/eks"

  providers = { aws = aws.core }

  cluster_name                 = "gt100k-dev"
  cluster_role_arn             = module.eks_base_iam.cluster_role_arn
  node_role_arn                = module.eks_base_iam.node_role_arn
  private_subnet_ids           = module.network.private_subnet_ids
  security_group_ids           = [module.network.workload_security_group_id]
  node_security_group_id       = module.network.workload_security_group_id
  cluster_admin_principal_arns = var.cluster_admin_principal_arns
  oidc_thumbprint_list         = var.oidc_thumbprint_list
}

module "workload_irsa" {
  source = "../../modules/iam"

  providers = { aws = aws.core }

  name_prefix       = "gt100k-dev"
  create_eks_roles  = false
  oidc_provider_arn = module.cluster.oidc_provider_arn
  oidc_issuer_url   = module.cluster.oidc_issuer_url
  irsa_roles        = var.irsa_roles
}

module "database" {
  source = "../../modules/rds"

  providers = { aws = aws.core }

  identifier         = "gt100k-dev"
  private_subnet_ids = module.network.private_subnet_ids
  security_group_ids = [module.network.workload_security_group_id]
  kms_key_arn        = module.identity_storage.kms_key_arn
}

module "event_runtime" {
  source = "../../modules/event-runtime"

  aws_region = var.aws_region
}
