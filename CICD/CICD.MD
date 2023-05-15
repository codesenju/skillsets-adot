### Pre-requisite check
- Ingress Controller
- External DNS

### Create ECR Repository for your Application Docker Images
```bash
ECR_REPO_NAME=***

aws ecr create-repository --repository-name $ECR_REPO_NAME --image-tag-mutability IMMUTABLE --image-scanning-configuration scanOnPush=true

ECR_REPO_URL=$(aws ecr describe-repositories --repository-names $ECR_REPO_NAME --query 'repositories[0].repositoryUri' --output text)

XXXXXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/skillsets-api
XXXXXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/skillsets-ui
```

### Create CodeCommit Repository and push local code to repo
```bash
REPO_NAME="argocd-k8s-manifests"
aws codecommit create-repository --repository-name $REPO_NAME
REPO_URL=$(aws codecommit get-repository --repository-name $REPO_NAME --query 'repositoryMetadata.cloneUrlHttp' --output text)
echo $REPO_URL


# --
cd <your-directory>
git init
git add .
git commit -m "Initial commit"
git remote add codecommit $REPO_URL
git push codecommit master
# ---
cd <your-directory>
git remote add codecommit $REPO_URL
git push codecommit main
# --
```
### Create STS Assume IAM Role for CodeBuild to interact with AWS EKS
```bash
# Export your Account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Set Trust Policy
TRUST="{ \"Version\": \"2012-10-17\", \"Statement\": [ { \"Effect\": \"Allow\", \"Principal\": { \"AWS\": \"arn:aws:iam::${AWS_ACCOUNT_ID}:root\" }, \"Action\": \"sts:AssumeRole\" } ] }"

# Verify inside Trust policy, your account id got replacd
echo $TRUST

# Create IAM Role for CodeBuild to Interact with EKS
aws iam create-role --role-name EksCodeBuildKubectlRole --assume-role-policy-document "$TRUST" --output text --query 'Role.Arn's

# Define Inline Policy with eks Describe permission in a file iam-eks-describe-policy
echo '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Action": "eks:Describe*", "Resource": "*" } ] }' > /tmp/iam-eks-describe-policy

# Associate Inline Policy to our newly created IAM Role
aws iam put-role-policy --role-name EksCodeBuildKubectlRole --policy-name eks-describe --policy-document file:///tmp/iam-eks-describe-policy

# Verify the same on Management Console
```

### Update EKS Cluster aws-auth ConfigMap with new role created in previous step
```bash
# Verify what is present in aws-auth configmap before change
kubectl get configmap aws-auth -o yaml -n kube-system

# Export your Account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Set ROLE value
ROLE="    - rolearn: arn:aws:iam::${AWS_ACCOUNT_ID}:role/EksCodeBuildKubectlRole\n      username: build\n      groups:\n        - system:masters"

# Get current aws-auth configMap data and attach new role info to it
kubectl get -n kube-system configmap/aws-auth -o yaml | awk "/mapRoles: \|/{print;print \"$ROLE\";next}1" > /tmp/aws-auth-patch.yml

# Patch the aws-auth configmap with new role
kubectl patch configmap/aws-auth -n kube-system --patch "$(cat /tmp/aws-auth-patch.yml)"

# Alternatively you can use eksctl
EKS_CLUSTER=**
eksctl create iamidentitymapping --cluster $EKS_CLUSTER --arn  arn:aws:iam::${AWS_ACCOUNT_ID}:role/EksCodeBuildKubectlRole --username build --group system:masters

# Verify what is updated in aws-auth configmap after change
kubectl get configmap aws-auth -o yaml -n kube-system
```

## CodeBuild

###
```bash
AWS_REGIOIN=$(aws configure get region)
# XXXXXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/skillsets-api
# XXXXXXXXXXXX.dkr.ecr.us-east-1.amazonaws.com/skillsets-ui
# Environment Variables for CodeBuild
echo "REPOSITORY_URI = ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/skillsets"
echo "EKS_KUBECTL_ROLE_ARN = arn:aws:iam::${AWS_ACCOUNT_ID}:role/EksCodeBuildKubectlRole"
echo "EKS_CLUSTER_NAME = $EKS_CLUSTER"
```

## CodePipeline
```bash
aws codepipeline create-pipeline --pipeline-name eks-devops-pipe --pipeline file://pipeline.json
```

```bash
aws codepipeline get-pipeline --name eks-devops-pipeline --query 'pipeline' --output yaml > pipeline.yaml

aws codepipeline create-pipeline --cli-input-yaml file://pipeline.yaml
```

## Codebuild
```bash
aws codebuild batch-get-projects --names eks-devops-cb-for-pipeline --query 'projects[0]' --output yaml > project.yaml
```

## Docker Secret
```bash
SECRET_NAME="my-docker-secret"
DOCKER_USERNAME="my-username"
DOCKER_PASSWORD="my-password"

aws secretsmanager create-secret --name $SECRET_NAME --secret-string "{\"username\":\"$DOCKER_USERNAME\",\"password\":\"$DOCKER_PASSWORD\"}"
```

### How to use my-docker-secret
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Docker...
      - DOCKER_CREDS=$(aws secretsmanager get-secret-value --secret-id my-docker-secret --query SecretString --output text)
      - DOCKER_USERNAME=$(echo $DOCKER_CREDS | jq -r .username)
      - DOCKER_PASSWORD=$(echo $DOCKER_CREDS | jq -r .password)
      - echo $DOCKER_PASSWORD | docker login --username $DOCKER_USERNAME --password-stdin
  build:
    commands:
      - echo Build started on `date`
      # Add your build commands here
```

### Add IAM permissions to Codebuild
```bash
#  Get the ARN of a secret by its name
SECRET_NAME="my-docker-secret"
aws secretsmanager describe-secret --secret-id $SECRET_NAME --query 'ARN' --output text

cat <<EOF> secret-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "CodeBuildSecretsManagerAccess",
            "Effect": "Allow",
            "Action": "secretsmanager:GetSecretValue",
            "Resource": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${SECRET_NAME}*"
        }
    ]
}
EOF


# Create policy with GetSecretValue permissions
POLICY_NAME="001_CodeBuildSecretsManagerAccess"
aws iam create-policy --policy-name $POLICY_NAME --policy-document file://secret-policy.json
#  List the names of all CodeBuild projects in your AWS account.
aws codebuild list-projects --output text
# Get the service role name of a particular CodeBuild project
PROJECT_NAME="eks-devops-cb-for-pipeline"
# Get role name
ROLE_NAME=$(aws codebuild batch-get-projects --names $PROJECT_NAME --query 'projects[0].serviceRole' --output text | awk -F/ '{print $NF}')
# Attach policy to the role
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/$POLICY_NAME

```

## Test by assuming the role
### Add appropriate trust relationships to the role you wish to assume
```bash
export ROLE_NAME=my-role

cat <<EOF> trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": {
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::${AWS_ACCOUNT_ID}:user/test-user"},
    "Action": "sts:AssumeRole"
  }
}
EOF

aws iam update-assume-role-policy --role-name ${ROLE_NAME} --policy-document file://trustpolicy.json
```
### Assume the role
```bash
ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/service-role/codebuild-eks-devops-cb-for-pipeline-service-role"
SESSION_NAME="codebuild-session"

CREDENTIALS=$(aws sts assume-role --role-arn $ROLE_ARN --role-session-name $SESSION_NAME)

ACCESS_KEY_ID=$(echo $CREDENTIALS | jq -r '.Credentials.AccessKeyId')
SECRET_ACCESS_KEY=$(echo $CREDENTIALS | jq -r '.Credentials.SecretAccessKey')
SESSION_TOKEN=$(echo $CREDENTIALS | jq -r '.Credentials.SessionToken')

PROFILE_NAME="test-codebuild-role"

aws configure set aws_access_key_id $ACCESS_KEY_ID --profile $PROFILE_NAME
aws configure set aws_secret_access_key $SECRET_ACCESS_KEY --profile $PROFILE_NAME
aws configure set aws_session_token $SESSION_TOKEN --profile $PROFILE_NAME


# Test with access denied
aws s3 ls --profile test-codebuild-role
# Test working
aws secretsmanager get-secret-value --secret-id $SECRET_NAME --query SecretString --output text  --profile test-codebuild-role
```

# Reference:
- https://www.stacksimplify.com/aws-eks/aws-devops-eks/learn-to-master-devops-on-aws-eks-using-aws-codecommit-codebuild-codepipeline/