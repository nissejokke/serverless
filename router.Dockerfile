FROM denoland/deno:1.11.5

# The port that your application listens to.
EXPOSE 4000

WORKDIR /app

# Prefer not to run as root.
USER deno

COPY src/router.ts /app/
RUN deno cache --unstable router.ts

CMD ["run", "--allow-net", "--allow-env", "--unstable", "router.ts"]