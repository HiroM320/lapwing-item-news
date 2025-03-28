data "archive_file" "lambda_function" {
  type        = "zip"
  source_dir  = "../dist/code"
  output_path = "../dist/archive/${local.lambda.file_name}.zip"
}

resource "aws_lambda_function" "lambda_function" {
  function_name    = local.lambda.function_name
  filename         = data.archive_file.lambda_function.output_path
  source_code_hash = data.archive_file.lambda_function.output_base64sha256
  handler          = "${local.lambda.file_name}.${local.lambda.handler}"
  runtime          = local.lambda.runtime
  timeout          = 20

  architectures = ["arm64"]

  role = aws_iam_role.lambda_role.arn
}

resource "aws_iam_role" "lambda_role" {
  name = local.lambda.execution_role

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_iam_policy" "lambda_policy" {
  name = local.lambda.execution_policy

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ],
        Resource = aws_dynamodb_table.scraped_log.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:PutParameter",
          "ssm:GetParameter"
        ],
        Resource = [
          aws_ssm_parameter.latest_product_id.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "kms:Decrypt"
        ],
        Resource = [
          aws_ssm_parameter.twitter_api_key.arn,
          aws_ssm_parameter.twitter_api_secret.arn,
          aws_ssm_parameter.twitter_access_token.arn,
          aws_ssm_parameter.twitter_access_token_secret.arn
        ]
      },
    ]
  })
}
