output "amplify_app_id" {
  value = aws_amplify_app.caliquest.id
}

output "amplify_app_url" {
  value = "https://${var.branch_name}.${aws_amplify_app.caliquest.default_domain}"
}
