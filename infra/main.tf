terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_iam_role" "amplify" {
  name = "caliquest-amplify-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "amplify.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Required for SSR compute (WEB_COMPUTE) apps to invoke the Amplify-managed compute resources.
resource "aws_iam_role_policy_attachment" "amplify_ssr" {
  role       = aws_iam_role.amplify.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

resource "aws_amplify_app" "caliquest" {
  name       = "caliquest"
  repository = var.github_repository_url

  # Classic GitHub PAT (repo scope). Used once by AWS to create the webhook + deploy key;
  # AWS does not persist the token itself. GitHub fine-grained tokens are not supported here.
  access_token = var.github_access_token

  platform             = "WEB_COMPUTE"
  build_spec           = file("${path.module}/../amplify.yml")
  iam_service_role_arn = aws_iam_role.amplify.arn

  environment_variables = {
    NEXT_PUBLIC_SUPABASE_URL      = var.supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY = var.supabase_anon_key
    DB_PASS                       = var.db_pass
  }
}

resource "aws_amplify_branch" "main" {
  app_id            = aws_amplify_app.caliquest.id
  branch_name       = var.branch_name
  enable_auto_build = true
  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
}
