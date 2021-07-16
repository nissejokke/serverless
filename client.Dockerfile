FROM denoland/deno:1.11.5

# The port that your application listens to.
EXPOSE 1993

WORKDIR /app

# Prefer not to run as root.
USER deno

CMD ["run", "--allow-net", "--unstable", "client.ts"]