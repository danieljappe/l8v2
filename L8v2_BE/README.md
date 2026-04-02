# L8v2 Backend

This is the backend service for the L8v2 application, built with Node.js, Express, and TypeScript.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/l8v2
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   ```

4. Build the project:
   ```bash
   npm run build
   # or
   yarn build
   ```

## Development

To start the development server with hot-reload and TypeScript support:
```bash
npm run dev
# or
yarn dev
```

- The backend uses [TypeORM](https://typeorm.io/) for database management. You can run TypeORM CLI commands with:
  ```bash
  npm run typeorm -- <command>
  # or
  yarn typeorm -- <command>
  ```
  Example:
  ```bash
  npm run typeorm -- migration:run
  ```

## Production

To start the production server:
```bash
npm start
```
or
```bash
yarn start
```

## API Documentation

The API documentation will be available at `/api-docs` when the server is running.

## Models

The application includes the following models:

- User
- Artist
- Event
- Venue
- EventArtist
- Ticket
- GalleryImage
- ContactMessage

## Testing

To run tests:
```bash
npm test
```
or
```bash
yarn test
```

## License

This project is licensed under the MIT License. 