import { use, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import './App.css'
import RegistrationSys from './RegistrationSys';

function App() {
  const [message, setMessage] = useState('');

  // initial connection
  // useEffect(() => {
  //   fetch(`http://localhost:${import.meta.env.VITE_PORT}/`)
  //   .then(response => response.json())
  //   .then(data => setMessage(data[0].name));
  // }, [])

  return (
    <div className='border-2 border-solid bg-sky-200 w-screen h-screen'>
      <Router>
        <Link to='/register'>Sign Up</Link>
        <Routes>
          <Route path='/register' element={<RegistrationSys />}></Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App
