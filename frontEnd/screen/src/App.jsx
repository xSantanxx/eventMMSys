import { use, useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('');

  // initial connection
  useEffect(() => {
    fetch(`http://localhost:${import.meta.env.VITE_PORT}/`)
    .then(response => response.json())
    .then(data => setMessage(data[0].name));
  }, [])

  return (
    <div className='border-2 border-solid bg-sky-200 w-screen h-screen'>
    </div>
  )
}

export default App
