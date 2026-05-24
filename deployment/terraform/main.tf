# ==============================================================================
# AIVerse Nexus — Enterprise Distributed Infrastructure Terraform Configuration
# Targets: AWS EKS (Kubernetes), ElastiCache (Redis), CloudFront (CDN Cache)
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- VPC NETWORK INFRASTRUCTURE ---
resource "aws_vpc" "nexus_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "aiverse-nexus-vpc"
  }
}

resource "aws_subnet" "public_subnets" {
  count                   = 2
  vpc_id                  = aws_vpc.nexus_vpc.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name = "aiverse-nexus-public-subnet-${count.index}"
  }
}

# --- AMAZON EKS (KUBERNETES) CLUSTER ---
resource "aws_eks_cluster" "nexus_eks" {
  name     = "aiverse-nexus-eks"
  role_arn = aws_iam_role.eks_role.arn

  vpc_config {
    subnet_ids = aws_subnet.public_subnets[*].id
  }
}

# --- GPU INFERENCE NODE GROUP ---
resource "aws_eks_node_group" "gpu_inference_pool" {
  cluster_name    = aws_eks_cluster.nexus_eks.name
  node_group_name = "gpu-inference-workers"
  node_role_arn   = aws_iam_role.node_role.arn
  subnet_ids      = aws_subnet.public_subnets[*].id

  scaling_config {
    desired_size = 3
    max_size     = 12
    min_size     = 3
  }

  instance_types = ["g4dn.2xlarge"] # Standard AWS GPU instances with NVIDIA T4 Tensor Cores

  update_config {
    max_unavailable = 1
  }
}

# --- AMAZON ELASTICACHE REDIS (HOT FEATURE CACHE) ---
resource "aws_elasticache_cluster" "redis_feature_cache" {
  cluster_id           = "nexus-feature-cache"
  engine               = "redis"
  node_type            = "cache.m6g.large"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnets.name
}

resource "aws_elasticache_subnet_group" "redis_subnets" {
  name       = "redis-subnets"
  subnet_ids = aws_subnet.public_subnets[*].id
}

# --- CLOUDFRONT CDN DISTRIBUTION (GLOBAL EDGE CACHE) ---
resource "aws_cloudfront_distribution" "cdn_distribution" {
  origin {
    domain_name = aws_s3_bucket.client_bucket.bucket_regional_domain_name
    origin_id   = "S3-AIVerseClient"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-AIVerseClient"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# --- S3 BUCKET HOUSING STATIC CLIENT ASSETS ---
resource "aws_s3_bucket" "client_bucket" {
  bucket = "aiverse-nexus-static-bucket-s3"
}

# --- DATA & VARIABLES ---
data "aws_availability_zones" "available" {}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

# --- COMPATIBILITY IAM ROLES (Simulated simple bindings) ---
resource "aws_iam_role" "eks_role" {
  name = "nexus-eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role" "node_role" {
  name = "nexus-eks-node-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}
