### Pre-requisite check
- Ingress Controller
- External DNS


### Create ECR Repository for your Application Docker Images
```bash
ECR_REPO_NAME=***

aws ecr create-repository --repository-name $ECR_REPO_NAME --image-tag-mutability IMMUTABLE --image-scanning-configuration scanOnPush=true

ECR_REPO_URL=$(aws ecr describe-repositories --repository-names $ECR_REPO_NAME --query 'repositories[0].repositoryUri' --output text)

587878432697.dkr.ecr.us-east-1.amazonaws.com/skillsets-api
587878432697.dkr.ecr.us-east-1.amazonaws.com/skillsets-ui
```

### Create CodeCommit Repository and push local code to repo
```bash
CC_REPO_NAME=***
aws codecommit create-repository --repository-name $CC_REPO_NAME

# --
cd <your-directory>
git init
git add .
git commit -m "Initial commit"
git remote add codecommit <repository-url>
git push codecommit master
# ---
cd <your-directory>
git remote add codecommit <repository-url>
git push codecommit master
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
# 587878432697.dkr.ecr.us-east-1.amazonaws.com/skillsets-api
# 587878432697.dkr.ecr.us-east-1.amazonaws.com/skillsets-ui
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