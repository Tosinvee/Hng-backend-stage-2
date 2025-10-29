Country Currency & Exchange API

A RESTful API that fetches country data, currency exchange rates, computes estimated GDP, caches data in a database, and serves summary data including a generated image of the top countries by GDP.

Features

Fetch countries and currencies from external APIs

Compute estimated GDP per country

Cache country data in MySQL via Prisma

CRUD operations for country records

Generate and serve a summary image of the top 5 countries by GDP

Fully environment-variable driven (no hardcoded URLs or paths)

Proper error handling for validation and external API failures

Tech Stack

Node.js + TypeScript

Express.js

Prisma ORM

MySQL

@napi-rs/canvas

Axios

dotenv

Setup Instructions

Clone the repository

git clone https://github.com/your-username/country-exchange-api.git
cd country-exchange-api

Install dependencies

npm install

Create .env file in project root

Run Prisma migrations & generate client

npx prisma migrate dev --name init
npx prisma generate

Run the API

Development:

npx ts-node src/index.ts

Production:

npm run build
npm start
