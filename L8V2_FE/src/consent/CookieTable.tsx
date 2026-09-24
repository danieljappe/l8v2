import React from 'react';
import { CONSENT_CATEGORIES, itemsInCategory } from './registry';

/** The privacy policy's cookie list, generated from the registry so it cannot drift from the code. */
const CookieTable: React.FC = () => (
  <div className="my-4 overflow-x-auto rounded-xl border border-white/10" data-testid="cookie-table">
    <table className="w-full min-w-[760px] text-left text-sm">
      <caption className="sr-only">Cookies og lokal lagring på l8events.dk</caption>
      <thead className="bg-white/10 text-white">
        <tr>
          {['Kategori', 'Navn', 'Udbyder', 'Formål', 'Type', 'Varighed', 'Uden for EU/EØS'].map((h) => (
            <th key={h} scope="col" className="px-3 py-2 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CONSENT_CATEGORIES.flatMap((category) =>
          itemsInCategory(category.id).map((item) => (
            <tr key={item.id} className="border-t border-white/10 align-top">
              <td className="px-3 py-2">{category.title}</td>
              <td className="break-all px-3 py-2 font-mono text-xs leading-5">{item.names.join(', ')}</td>
              <td className="px-3 py-2">{item.provider}</td>
              <td className="px-3 py-2">{item.purpose}</td>
              <td className="px-3 py-2">
                {item.storageType === 'cookie' ? 'Cookie' : 'Lokal lagring'}
                {item.setBy === 'third_party' ? ' (sættes af udbyderen)' : ''}
              </td>
              <td className="px-3 py-2">{item.duration}</td>
              <td className="px-3 py-2">{item.transfersOutsideEEA ? 'Ja' : 'Nej'}</td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  </div>
);

export default CookieTable;
