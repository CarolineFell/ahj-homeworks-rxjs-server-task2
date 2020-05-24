const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const uuid = require('uuid');
const app = new Koa();
const faker = require('faker');


app.use(async(ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = {...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }

    ctx.response.status = 204;
  }
});

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));


const router = new Router();
const comments = [];
let posts = [];

function randomMinMax(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createComment(postId, authorId) {
  let number = randomMinMax(1, 10);

  for (let i = 0; i < number; i++) {
    comments.unshift({
      "id": uuid.v4(),
      "post_id": postId,
      "author_id": authorId,
      "author": faker.name.findName(),
      "avatar": faker.image.avatar(),
      "content": faker.lorem.sentence(),
      "created": Date.now()
    })
  }
  return comments;
}

setInterval(() => {
  let authorId = uuid.v4();
  let postId = uuid.v4();
  posts.unshift({
    "id": postId,
    "author_id": authorId,
    "title": faker.lorem.slug(),
    "author": faker.name.findName(),
    "avatar": faker.image.avatar(),
    "image": faker.image.image(),
    "created": Date.now()
  });
  createComment(postId, authorId)
}, 5000);

router.get('/posts/latest', async(ctx, next) => {
  if (posts.length > 3) {
    posts = posts.slice(0, 10);
  }

  ctx.response.body = {
    "status": "ok",
    "data": JSON.stringify(posts)
  }
});

router.get('/posts/id?=/comments/latest', async(ctx, next) => {
  let latestComments = comments.filter((item) => item.author_id === ctx.params.id);
  if (latestComments.length > 3) {
    latestComments = latestComments.slice(-3);
  }
  ctx.response.body = {
    "status": "ok",
    "data": JSON.stringify(latestComments)
  }
});
app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
server.listen(port);