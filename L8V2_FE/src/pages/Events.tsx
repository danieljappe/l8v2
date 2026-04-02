import React from 'react';
import EventList from '../components/EventList';
import { useSEO } from '../hooks/useSEO';

const Events: React.FC = () => {
  // SEO optimization
  useSEO({
    title: 'Kommende Begivenheder - L8 Events',
    description: 'Udforsk L8 Events kommende begivenheder med fokus på den nye bølge af dansk musik. Find datoer, lokationer, billetter og oplev uforglemmelige musikkopplevelser med spirrende artister i vækstlaget.',
    keywords: 'L8 Events begivenheder, kommende events, dansk musik events, elektronisk musik, event kalender, billetter, musikkopplevelser, DJ events, musik events Danmark, vækstlaget musik, spillesteder',
    url: '/events'
  });

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Main Content */}
      <main className="relative z-10 pt-6">
        <EventList />
      </main>
    </div>
  );
};

export default Events; 