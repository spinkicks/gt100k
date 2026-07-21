terraform {
  required_version = "~> 1.11"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"

  validation {
    condition     = contains(["us-east-1", "us-east-2", "us-west-1", "us-west-2"], var.aws_region)
    error_message = "aws_region must be a commercial US AWS region."
  }
}

data "aws_region" "current" {}

check "aws_region" {
  assert {
    condition     = data.aws_region.current.name == var.aws_region
    error_message = "aws_region must match the injected AWS provider region."
  }
}

variable "name" {
  type    = string
  default = "gt100k"
}

variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"

  validation {
    condition     = can(cidrnetmask(var.vpc_cidr))
    error_message = "vpc_cidr must be valid IPv4 CIDR notation."
  }
}

variable "private_subnet_cidrs" {
  type = map(string)
  default = {
    a = "10.40.0.0/20"
    b = "10.40.16.0/20"
    c = "10.40.32.0/20"
  }

  validation {
    condition = (
      length(var.private_subnet_cidrs) >= 3 &&
      alltrue([for cidr in values(var.private_subnet_cidrs) : can(cidrnetmask(cidr))])
    )
    error_message = "At least three valid private subnet CIDRs are required."
  }
}

locals {
  interface_endpoint_services = toset([
    "autoscaling",
    "ec2",
    "ecr.api",
    "ecr.dkr",
    "logs",
    "sts",
  ])
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = var.name
  }
}

resource "aws_default_security_group" "default_deny" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.name}-default-deny"
  }
}

resource "aws_subnet" "private" {
  for_each = var.private_subnet_cidrs

  vpc_id                  = aws_vpc.this.id
  availability_zone       = "${var.aws_region}${each.key}"
  cidr_block              = each.value
  map_public_ip_on_launch = false

  tags = {
    Name                              = "${var.name}-private-${each.key}"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

resource "aws_route_table" "private" {
  for_each = aws_subnet.private

  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.name}-private-${each.key}"
  }
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  route_table_id = aws_route_table.private[each.key].id
  subnet_id      = each.value.id
}

resource "aws_security_group" "workload" {
  name        = "${var.name}-workload-endpoint-access"
  description = "Default-deny workload egress; explicit VPC endpoints only"
  vpc_id      = aws_vpc.this.id
}

resource "aws_security_group" "endpoints" {
  name        = "${var.name}-interface-endpoints"
  description = "TLS ingress from the workload security group"
  vpc_id      = aws_vpc.this.id
}

resource "aws_vpc_security_group_ingress_rule" "endpoint_https" {
  security_group_id            = aws_security_group.endpoints.id
  referenced_security_group_id = aws_security_group.workload.id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
}

resource "aws_vpc_security_group_egress_rule" "workload_https" {
  security_group_id            = aws_security_group.workload.id
  referenced_security_group_id = aws_security_group.endpoints.id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
}

resource "aws_vpc_endpoint" "interface" {
  for_each = local.interface_endpoint_services

  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${var.aws_region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = [for subnet in aws_subnet.private : subnet.id]
  security_group_ids  = [aws_security_group.endpoints.id]
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [for route_table in aws_route_table.private : route_table.id]
}

resource "aws_vpc_security_group_egress_rule" "workload_s3" {
  security_group_id = aws_security_group.workload.id
  prefix_list_id    = aws_vpc_endpoint.s3.prefix_list_id
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_egress_rule" "workload_dns_udp" {
  security_group_id = aws_security_group.workload.id
  cidr_ipv4         = var.vpc_cidr
  ip_protocol       = "udp"
  from_port         = 53
  to_port           = 53
}

resource "aws_vpc_security_group_egress_rule" "workload_dns_tcp" {
  security_group_id = aws_security_group.workload.id
  cidr_ipv4         = var.vpc_cidr
  ip_protocol       = "tcp"
  from_port         = 53
  to_port           = 53
}

output "vpc_id" {
  value = aws_vpc.this.id
}

output "private_subnet_ids" {
  value = [for name in sort(keys(aws_subnet.private)) : aws_subnet.private[name].id]
}

output "default_deny_security_group_id" {
  value = aws_default_security_group.default_deny.id
}

output "workload_security_group_id" {
  value = aws_security_group.workload.id
}
