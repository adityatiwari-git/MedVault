import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('Loading MedVault...');

  useEffect(() => {
    setStatus('MedVault migration foundation is ready.');
  }, []);

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-fuchsia-50 via-purple-50 to-pink-50 p-6">
      <section className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-fuchsia-600">
          MedVault
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          Independent application foundation
        </h1>
        <p className="mt-4 text-gray-600">{status}</p>
      </section>
    </main>
  );
}

export default App;