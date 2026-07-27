variable "aws_region" {
  description = "AWS region to deploy the Amplify app into"
  type        = string
  default     = "us-east-1"
}

variable "github_repository_url" {
  description = "HTTPS URL of the GitHub repository Amplify should build from"
  type        = string
  default     = "https://github.com/bettisonr1/caliquest"
}

variable "branch_name" {
  description = "Git branch Amplify should track for production deploys"
  type        = string
  default     = "main"
}

variable "github_access_token" {
  description = "GitHub personal access token (classic, repo scope). Used once to connect Amplify to the repo; not persisted by AWS. Pass via TF_VAR_github_access_token, never commit it."
  type        = string
  sensitive   = true
}

variable "supabase_url" {
  description = "Supabase project URL (NEXT_PUBLIC_SUPABASE_URL). Public by design but pass via TF_VAR_supabase_url to keep it out of the .tf files."
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY). Public by design but pass via TF_VAR_supabase_anon_key to keep it out of the .tf files."
  type        = string
  sensitive   = true
}

variable "db_pass" {
  description = "Database password (DB_PASS). Pass via TF_VAR_db_pass, never commit it."
  type        = string
  sensitive   = true
}
