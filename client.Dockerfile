FROM denoland/deno:1.11.5

# The port that your application listens to.
EXPOSE 1993

WORKDIR /app

# Copy code and custom entry point
COPY src/client.ts src/func.ts client-entry.sh /app/
RUN chown -R deno:deno /app

# Prefer not to run as root.
USER deno
RUN deno cache --unstable client.ts

#RUN deno cache client.ts
ENTRYPOINT ["/app/client-entry.sh"]

CMD ["run", "--allow-net", "--allow-env", "--allow-read=/temp", "--allow-write=/temp", "--unstable", "client.ts"]