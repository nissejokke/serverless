FROM denoland/deno:1.11.5

# The port that your application listens to.
EXPOSE 4001

WORKDIR /app
#RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
#    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
RUN apt-get update && \
    apt-get install -y apt-transport-https ca-certificates curl && \
    curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list && \
    apt-get update && \
    apt-get install -y kubectl

# Copy code and custom entry point
COPY src/manager.ts /app/
RUN chown -R deno:deno /app

# Prefer not to run as root.
USER deno
RUN deno cache --unstable manager.ts

CMD ["run", "--allow-all", "--unstable", "manager.ts"]