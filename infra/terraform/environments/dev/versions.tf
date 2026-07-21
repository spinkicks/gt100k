terraform {
  required_version = "~> 1.11"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  alias  = "organization"
  region = var.aws_region
}

provider "aws" {
  alias  = "core"
  region = var.aws_region
}

provider "aws" {
  alias  = "identity"
  region = var.aws_region
}
