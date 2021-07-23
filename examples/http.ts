import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const app = new Application();
const router = new Router();

const books = new Map<string, any>();
books.set("1", {
  id: "1",
  title: "The Hound of the Baskervilles",
  author: "Conan Doyle, Arthur",
});

router
  .get("/", (context) => {
    context.response.body = "Hello world!";
  })
  .get("/book", (context) => {
    context.response.body = Array.from(books.values());
  })
  .get("/book/:id", (context) => {
    if (context.params && context.params.id && books.has(context.params.id)) {
      context.response.body = books.get(context.params.id);
    }
  });

app.use(router.routes());
app.use(router.allowedMethods());

export default async function handler({ req }: { req: Deno.RequestEvent, conn?: Deno.Conn }): Promise<void> {
  const res = await app.handle(req.request);
  if (res) {
    req.respondWith(res);
  }
}