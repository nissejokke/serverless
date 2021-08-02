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
    apt-get install -y kubectl && \
    apt-get install -y wget tar && \
    cd ~ && \
    wget https://github.com/digitalocean/doctl/releases/download/v1.62.0/doctl-1.62.0-linux-amd64.tar.gz && \
    tar xf ~/doctl-1.62.0-linux-amd64.tar.gz && \
    mv ~/doctl /usr/local/bin

# Copy code and custom entry point
COPY src manager-entry.sh /app/
RUN chown -R deno:deno /app

# Prefer not to run as root.
RUN mkhomedir_helper deno
RUN mkdir -p /home/deno/.kube
RUN chown -R deno:deno /home/deno
USER deno
RUN deno cache --unstable manager.ts
ENTRYPOINT ["/app/manager-entry.sh"]

CMD ["run", "--allow-all", "--unstable", "manager.ts"]