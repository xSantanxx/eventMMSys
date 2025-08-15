import { use, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import './App.css'
import RegistrationSys from './RegistrationSys';
import Event from './Event'
import { useParams } from 'react-router-dom';
import Sign from './Sign';

function App() {
  const [message, setMessage] = useState('');
  const [fade, setFade] = useState(false);
  const [regName, setRegName] = useState('');
  const [regDes, setRegDes] = useState('');
  const [errPop, setErrPop] = useState(false);
  const [form, setForm] = useState(false);
  const [names, setNames] = useState([]);
  const [links, setLinks] = useState([]);

  async function addEvent(e){
    e.preventDefault();

    const fullDate = new Date().toJSON().slice(0,10).replace(/-/g, '-');
    const fullDateWTime = new Date().toJSON().slice(0,19).replace(/T/g, ' ');
    const full = new Date().toJSON();

    console.log(full);

    try {
      const postOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: regName,
          date: fullDate,
          description: regDes,
          created_at: fullDateWTime
        })
      };
      const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/addEvent`, postOptions)
      const data = await response.json();
      if('errors' in data){
        const box = document.getElementById('errorBox')
        box.innerText = '';
        for(let i = 0; i < data.errors.length; i++){
          const text = document.createElement('p');
          text.innerText = data.errors[i].msg;
          box.appendChild(text);
        }
        setErrPop(!errPop);
        setRegName('');
        setRegDes('');
        setTimeout(() => {
          setErrPop(false);
        }, 3000);
      } else {
        alert(data.message);
        setRegName('');
        setRegDes('');
      }
    } catch (err) {
      console.log(err);
    } finally {
      setForm(false);
    }
  }

  const startForm = () => {
    setForm(!form);
  }


  useEffect(() => {
    async function events(){

      const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/getEvents`);
      const data = await response.json();
      const names = data.map((e) => <Link key={e.id} to={`/${e.id}`}>{e.name}</Link>)
      setNames(names);
    }
    events();
  });

  const {id} = useParams();




  return (
    <div className='border-2 border-solid bg-rose-100 w-screen h-screen flex justify-center items-center'>
      <div className='absolute top-[22%] left-[18%]'>
        <button onClick={startForm} className={` ${form ? "bg-red-500 hover:bg-red-700" : ""} border-2 border-solid rounded-full cursor-pointer
        w-22 h-auto bg-green-500  hover:bg-green-600 hover:bg-green-300 hover:duration-300 ease-out`}>Create</button></div>
        {/* Pop for form */}
        <div className={`${form ? "opacity-100 visible" : "opacity-0"} transition-all invisible absolute bg-red-500 border-2 border-solid w-[35%]
        h-[33%] top-[15%] rounded-xl flex flex-col`}>
          <form action="" onSubmit={addEvent}>
            <p className='justify-self-center text-2xl font-bold'>Add Event</p>
            <label className='text-base hover:text-white flex absolute top-[20%] ml-3' htmlFor="name">Name</label>
                <input placeholder='John Doe' type="text" className='ml-3 absolute w-3/4 top-[27%] border-2 border-solid rounded-lg' value={regName} onChange={e => setRegName(e.target.value)}/>
                <label className='text-base hover:text-white flex absolute top-[45%]  mb-4 ml-3' htmlFor="Description">Description</label>
                <input placeholder='Enter Description of event' className='ml-3 absolute w-3/4 top-[53%]  border-2 border-solid rounded-lg' type="text" value={regDes} onChange={e => setRegDes(e.target.value)}/>
                <button type='submit' 
                className={`hover:bg-green-500 duration-300 cursor-pointer border-2 border-solid w-23 h-12 rounded-xl bg-white absolute top-[84%] left-[40%]`}>Register</button>
          </form>
        </div>
        {/* Error */}
        <div className={` ${errPop ? 'opacity-100 visible' : 'opacity-0' }  invisible transition-all duration-300 flex justify-center absolute rounded-t-lg bg-blue-500 border-t-2 border-r-2 border-l-2 border-solid w-4/12 h-[6%] top-[25%] z-100`}>
          <p className='font-bold text-2xl my-2'>Errors</p>
        </div>
        <div id='errorBox' className={`${errPop ? 'opacity-100 visible' : 'opacity-0' } invisible duration-300  *:my-4  flex flex-col overflow-x-auto rounded-xl bg-blue-500 border-2 border-solid absolute w-4/12 h-[25%] top-[30%]`}>
        </div>
      <div id='hub' className='bg-zinc-200 flex flex-col border-2 border-solid w-2/3 h-2/4 overflow-x-auto rounded-xl'>
        <Router>
          <div className='flex flex-col'>{names}</div>
          <Routes>
            <Route path='/' element={''}></Route>
            <Route path='/:id/*' element={<Event />}></Route>
            <Route path='/:id/signin' element={<Sign />}></Route>
            <Route path='/:id/register' element={<RegistrationSys />}></Route>
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App
