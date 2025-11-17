# E-Commerce Microservices Platform

End-to-end e-commerce stack composed of independently deployable Node.js services, a TypeScript/React storefront, and a lightweight API gateway. The project demonstrates how to structure a production-oriented system with shared libraries, asynchronous messaging, and Docker-first workflows.

## Architecture at a Glance

- **Clients**: Vite-powered React storefront in `frontend/` plus any third-party consumer communicating via REST.
- **API Gateway** (`gateway/`): Central entrypoint that handles routing, auth context, and composition across downstream services.
- **Domain services** (`services/*`): User, Product, Order, Payment, Inventory, Shipping, and Notification services, each with its own MongoDB database and health endpoint.
- **Messaging**: RabbitMQ (port `5672` / management UI `15672`) for inter-service events (inventory reservations, payment notifications, emails, etc.).
- **Shared utilities** (`shared-utils/`): Common logger, validation, middleware, and RabbitMQ helpers published as the `@ecommerce/shared-utils` workspace package.

| Component             | Default Port | Responsibilities |
| -------------------- | ------------ | ---------------- |
| `gateway`            | 3000         | Auth, request aggregation, routing to domain services |
| `user-service`       | 5001         | Customer accounts, sessions, profile management |
| `product-service`    | 5002         | Catalog, media uploads (Cloudinary), inventory snapshots |
| `order-service`      | 5003         | Checkout, order placement, coordination with inventory |
| `payment-service`    | 5004         | Payment intents, transaction status publishing |
| `inventory-service`  | 5005         | Stock levels, reservations, RabbitMQ consumers |
| `shipping-service`   | 5006         | Shipment creation, tracking hooks |
| `notification-service` | n/a        | Email + async notification workers listening on RabbitMQ |

## Tech Stack

- **Backend**: Node.js 18+, Express 5, Mongoose, RabbitMQ, Cloudinary + SMTP integrations.
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Redux Toolkit, React Hook Form, Yup.
- **Tooling**: Docker Compose, npm workspaces, shared utility package, nodemon for local service reloads.

## Repository Layout

```
.
├─frontend/                 # React storefront (Vite)
├─gateway/                  # Express gateway
├─services/
│  ├─user-service/
│  ├─product-service/
│  ├─order-service/
│  ├─payment-service/
│  ├─inventory-service/
│  ├─shipping-service/
│  └─notification-service/
├─shared-utils/             # Reusable logger, middleware, mq helpers
├─docker-compose.yml
├─.env.example
└─package.json
```

## Prerequisites

- Node.js **18+** and npm **8+** (used for workspace scripts and running services outside Docker).
- Docker Desktop / Docker Engine with Compose v2.
- MongoDB databases for each service. Create standalone Docker containers, run Atlas clusters, or update the `MONGODB_URI_*` variables to point to your own databases (a Mongo container is not bundled in `docker-compose.yml`).
- Cloudinary account + SMTP credentials if you plan to exercise media uploads or email notifications.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
   This installs every workspace package (`services/*`, `gateway`, `shared-utils`).

2. **Seed environment variables**
   ```bash
   npm run env:setup   # copies .env.example to .env
   ```
   Populate the generated `.env` with your MongoDB URIs, RabbitMQ credentials, JWT secret, email/Cloudinary values, and CORS origins.

3. **(Optional) Frontend env**
   Duplicate `frontend/.env.development` to `.env.local` (or adjust directly) so the SPA knows which gateway URL to call.

## Running the Stack with Docker Compose

```bash
# build and start everything (recommended for local dev)
npm run start:dev

# subsequent restarts without rebuilding
npm run start

# tail all service logs
npm run logs

# stop and remove containers
npm run stop
```

What you get:

- Gateway on `http://localhost:3000`
- Frontend (if started separately) hitting the gateway for data
- RabbitMQ at `http://localhost:15672` (username/password from `.env`, defaults to `guest/guest`)
- All services reachable inside the Docker network at `http://<service-name>:<port>` and exposing `/health` for readiness probes
- A persisted `rabbitmq_data` volume for queue durability

> **MongoDB**: Ensure your URIs in `.env` point to running databases. If you are using Docker locally, start a companion container:  
> `docker run -d --name mongo -p 27017:27017 -v mongo_data:/data/db mongo:6`

## Frontend Development (Vite)

Run the storefront outside Docker for fast HMR:

```bash
cd frontend
npm install        # first time only
npm run dev        # defaults to http://localhost:5173
```

Configure `VITE_API_URL` (or the proxy rules defined in your env file) to hit the gateway (`http://localhost:3000`). The Redux Toolkit store lives under `frontend/src/app`, page examples (such as `CheckoutPage.tsx`) are inside `frontend/src/features`.

## Running a Single Microservice Locally

Each service can run independently when you need to debug with live reloads:

```bash
cd services/order-service
npm install           # or rely on root workspace install
npx nodemon server.js # requires NODE_ENV + service-specific env vars
```

Set the relevant `MONGODB_URI_*`, `PORT`, and any downstream URLs in your shell environment. All services expose `/health` so you can quickly confirm connectivity while iterating.

## Environment Variables

The `.env.example` file documents every value. Key groups include:

- **Core**: `NODE_ENV`, `ALLOWED_ORIGINS`, `CLIENT_URL`, `ADMIN_URL`.
- **MongoDB per service**: `MONGODB_URI_USER`, `MONGODB_URI_PRODUCT`, `MONGODB_URI_ORDER`, `MONGODB_URI_PAYMENT`, `MONGODB_URI_INVENTORY`, `MONGODB_URI_SHIPPING`.
- **Messaging**: `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`, `RABBITMQ_URI`.
- **Auth**: `JWT_SECRET`, `JWT_EXPIRE`, `JWT_COOKIE_EXPIRE`.
- **Service URLs & ports**: `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `INVENTORY_SERVICE_URL`, `SHIPPING_SERVICE_URL`, `GATEWAY_PORT`.
- **3rd parties**: `CLOUDINARY_*`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`.

Keep secrets out of version control—update `.env` locally or through your deployment platform’s secret manager.

## Helpful npm Scripts

- `npm run start:dev` – Build + start the entire Docker stack (recreates images).
- `npm run start` – Start existing containers without rebuilding.
- `npm run stop` – Stop and remove containers.
- `npm run logs` – Follow logs from every service.
- `npm run env:setup` – Copy `.env.example` to `.env`.

## Troubleshooting

- **Container failing health checks**: Inspect logs via `npm run logs` or `docker-compose logs <service>`. Check MongoDB credentials and network reachability.
- **RabbitMQ connection errors**: Confirm the credentials match `RABBITMQ_DEFAULT_USER/PASS` and that the management UI is reachable on `15672`.
- **CORS issues**: Make sure `ALLOWED_ORIGINS` includes the gateway and frontend URLs you are using.
- **Shared utils changes not picked up**: Rebuild the stack (`npm run start:dev`) or re-run `npm install` so the workspace dependency is re-symlinked.

Happy hacking! Contributions and issue reports are welcome—open a PR with your proposal or bugfix.
