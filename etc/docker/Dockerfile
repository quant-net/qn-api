FROM python:3.10-slim

# Set up the working directory in the container
WORKDIR /quantnet-api

# Install packages
RUN apt-get update && \
    apt-get install --yes --no-install-recommends \
    openssh-client \
    git \
    && apt-get clean

# Create a virtual environment
RUN python3 -m venv venv

# Update pip
RUN . venv/bin/activate && pip install --upgrade pip

# Set environment variable for GitLab Package Registry authentication
ARG PIP_EXTRA_INDEX_URL
ENV PIP_EXTRA_INDEX_URL=${PIP_EXTRA_INDEX_URL}

# Set up SSH
RUN mkdir -p -m 0700 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

# this step configure git and checks the ssh key is loaded
RUN --mount=type=ssh <<EOT
  set -e
  echo "Setting Git SSH protocol"
  git config --global url."git@github.com:".insteadOf "https://github.com/"
  (
    set +e
    ssh -T git@github.com
    if [ ! "$?" = "1" ]; then
      echo "No GitHub SSH key loaded exiting..."
      exit 1
    fi
  )
EOT

# Install quant-net-api and dependencies
COPY . /quantnet-api/
RUN --mount=type=ssh . venv/bin/activate && pip install --no-cache-dir -r requirements.txt
# RUN . venv/bin/activate && pip install .

# Add an entrypoint script
COPY /etc/docker/docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
