# Setup & quick usage (step-by-step)

Here’s a compact, hands-on guide to get you from repo → token → `node` query.

---

## 1) Prepare the project

###  Installation

```bash
git clone https://github.com/abir-hosen-ashik/redit-backend-tech-test.git
cd redit-backend-tech-test
npm install
```

Create `.env`:

```
PORT=3000
JWT_SECRET=redit
USER_NAME=alice
PASSWORD=admin
```


Start server:

```bash
npm run start
# or to watch against live change on file
npm run dev
```

You should see:

```
Server ready at http://localhost:3000/
```

---

## 2) Get a token (login)

You can use GraphQL UI (browser http://localhost:3000/) or `curl`.

### Using GraphQL Playground / Apollo Sandbox (open the server URL)

Run this mutation in the left pane:

```graphql
mutation {
  login(username: "alice", password: "admin")
}
```

Response will be:

```json
{
  "data": { "login": "eyJhbGciOi..." }
}
```

Copy that token.

### Or with `curl`

```bash
curl -s -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(username:\"alice\", password:\"admin\") }"}'
```

---

## 3) Use the token to call `node(nodeId)`

Set header `authorization: Bearer <token>`.

### In GraphQL UI

Click **HTTP HEADERS** (or top-right headers tab) and paste:

```json
{
  "authorization": "Bearer eyJhbGciOi..."
}
```

Then run:

```graphql
query {
  node(nodeId: "6297172e70a0c165b989cd10") {
    _id
    name
    trigger { _id name }
    responses { _id name }
    actions { _id name }
    parents { _id name }
  }
}
```

### With `curl`

Replace `<TOKEN>` and `<NODE_ID>`:

```bash
curl -s -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"query":"query { node(nodeId: \"6297172e70a0c165b989cd10\") { _id name trigger { _id name } responses { _id name } actions { _id name } parents { _id name } } }"}'
```

Successful response looks like:

```json
{
  "data": {
    "node": {
      "_id": "6297172e70a0c165b989cd10",
      "name": "User's Email",
      "trigger": {
        "_id": "6297176c10f525b8a81a9304",
        "name": "Email Trigger"
      },
      "responses": [
        {
          "_id": "6297189510f525833b1a9305",
          "name": "Get Email Response"
        }
      ],
      "actions": [],
      "parents": [
        {
          "_id": "6297164810f52524ba1a9300",
          "name": "Sign up Webinar"
        }
      ]
    }
  }
}
```

---

## 4) Notes & troubleshooting

* Token expiration: tokens are valid 1 hour. Re-run `login` if expired.
* `Unauthorized` error → you didn’t include `Authorization` header or sent an invalid token.
* As per pdf schema type definition `nodeId` kept optional.
* `node` returns `null` → node id not found in `info_doc/node.json` (check `_id` or compositeId mapping).
* If server not starting: check node version and that JSON files are readable in `require()`.
* As there are no mentions about `postActions` or `preActions` will be a part of `actions` on `node` object, so they are not concatenated in `node.action` attribute.

