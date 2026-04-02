# L8v2 Frontend

This is the frontend for the L8v2 application, built with React, TypeScript, Vite, and Tailwind CSS.

## Features
- Modern, responsive UI for event and gallery management
- Event listing, event details, and event calendar
- Gallery with search and filter by category
- About, Contact, and Booking sections
- Smooth navigation with React Router
- Animations with Framer Motion

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn

## Setup
1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
2. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at `http://localhost:5173` by default.

3. To build for production:
   ```bash
   npm run build
   # or
   yarn build
   ```

4. To preview the production build:
   ```bash
   npm run preview
   # or
   yarn preview
   ```

5. To lint the code:
   ```bash
   npm run lint
   # or
   yarn lint
   ```

## Project Structure
- `src/pages/` – Main pages (Home, Events, Gallery, About, Contact)
- `src/components/` – Reusable UI components
- `src/App.tsx` – Main app and routing

## License
This project is licensed under the MIT License.

#Ideas:

## Gallery

### Upload

Meta data på billede object

({
    imageId: processedImage.id,
    filename: file.originalname,
    paths: {
    original: processedImage.original,
    thumbnail: processedImage.sizes.thumbnail,
    medium: processedImage.sizes.medium,
    large: processedImage.sizes.large
    },
    metadata: processedImage.metadata,
    event: {
    name: eventName,
    date: eventDate,
    venue: venue
    },
    artists: artists ? artists.split(',').map(a => a.trim()) : [],
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    photographer: photographer
});
