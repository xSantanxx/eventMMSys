import { use, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import './App.css'
import RegistrationSys from './RegistrationSys';
import Event from './Event'
import Sign from './Sign';

function App() {
  const [message, setMessage] = useState('');
  const [fade, setFade] = useState(false);
  const [regName, setRegName] = useState('');
  const [regDes, setRegDes] = useState('');
  const [errPop, setErrPop] = useState(false);
  const [form, setForm] = useState(false);
  const [names, setNames] = useState([]);
  // const [errMsgs, setErrMsgs] = useState([]);
  const [links, setLinks] = useState([]);
  const [evNumb, setEvNumb] = useState(1);

  const loadEvents = async () => {
    try {
      const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/getEvents`);
      if (!response.ok) {
        throw new Error(`Unable to load events: ${response.status}`);
      }
      const data = await response.json();
      const names = data.map((e, i) => (
        <Link
          key={e.id}
          to={`/event`}
          state={{ eventId: e.id }}
          className='w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-100 hover:bg-zinc-800 transition-colors'
        >
          {i + 1}. {e.name}
        </Link>
      ));
      setNames(names);
    } catch (err) {
      console.log(err);
    }
  };

  async function addEvent(e){
    e.preventDefault();

    const now = new Date();
    const fullDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const createdAtIso = now.toISOString();

    try {
      const postOptions = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: regName,
          date: fullDate,
          description: regDes,
          created_at: createdAtIso
        })
      };
      const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/addEvent`, postOptions)
      const data = await response.json();
      console.log(data);
      if('errors' in data){
        // setErrMsgs(data.errors.map((err) => err.msg));
        toast.error(<div style={{whiteSpace: 'pre-line'}}>{data.errors.map((err) => err.msg).join('\n')}</div>);
        // setErrPop(true);
        setRegName('');
        setRegDes('');
        // setTimeout(() => {
        //   setErrPop(false);
        // }, 3000);
      } else {
        // setErrMsgs([]);
        // alert(data.message);
        toast.success(data.message);
        setRegName('');
        setRegDes('');
        await loadEvents();
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
    loadEvents();
  }, []);

  return (
    <div className='border-2 border-solid border-zinc-800 bg-zinc-950 text-zinc-100 w-screen h-screen flex justify-center items-center'>
        {/* Pop for form */}
        <div className={`${form ? "opacity-100 visible" : "opacity-0"} z-100 transition-all invisible absolute bg-zinc-900 border-2 border-solid border-zinc-800 w-[32%]
        h-[33%] top-[15%] rounded-xl flex flex-col`}>
          <div className='duration-300 relative w-7 mx-3 mt-2 rounded-full flex justify-center
          bg-red-600 hover:bg-red-500 hover:outline-2 hover:outline-red-500'>
            <button onClick={() => {setForm(!form)}} className='text-zinc-50 hover:opacity-50 opacity-0 cursor-pointer'>x</button>
            </div>
          <form action="" onSubmit={addEvent}>
            <p className='justify-self-center text-2xl font-bold'>Add Event</p>
            <label className='text-base text-zinc-200 flex absolute top-[20%] ml-3' htmlFor="name">Name</label>
                <input
                  placeholder='John Doe'
                  type="text"
                  className='ml-3 absolute w-3/4 top-[27%] border-2 border-solid rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-400 border-zinc-700'
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                />
                <label className='text-base text-zinc-200 flex absolute top-[45%] mb-4 ml-3' htmlFor="Description">Description</label>
                <input
                  placeholder='Enter Description of event'
                  className='ml-3 absolute w-3/4 top-[53%] border-2 border-solid rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-400 border-zinc-700'
                  type="text"
                  value={regDes}
                  onChange={e => setRegDes(e.target.value)}
                />
                <button type='submit' 
                className={`bg-emerald-600 hover:bg-emerald-500 text-zinc-50 duration-300 cursor-pointer border-2 border-solid border-emerald-700 w-23 h-12 rounded-xl absolute top-[84%] left-[40%]`}>Register</button>
          </form>
        </div>
        {/* Error */}
        {/* <div className={` ${errPop ? 'opacity-100 visible' : 'opacity-0' }  invisible transition-all duration-300 flex justify-center absolute rounded-t-lg bg-red-600/90 border-t-2 border-r-2 border-l-2 border-red-400 border-solid w-4/12 h-[6%] top-[25%] z-100 text-zinc-50`}>
          <p className='font-bold text-2xl my-2'>Errors</p>
        </div>
        <div id='errorBox' className={`${errPop ? 'opacity-100 visible' : 'opacity-0' } invisible duration-300  *:my-4  flex flex-col overflow-x-auto rounded-xl bg-red-600/90 border-2 border-red-400 border-solid text-zinc-50 absolute w-4/12 h-[25%] top-[30%]`}>
          {errMsgs.map((msg, idx) => (
            <p key={`${msg}-${idx}`}>{msg}</p>
          ))}
        </div> */}
      <div id='hub' className={`${form ? "opacity-0 hidden" : "opacity-100"} relative bg-zinc-900 flex flex-col border-2 border-solid border-zinc-800 rounded-xl min-w-[360px] min-h-[140px] w-fit h-fit max-h-[70vh] p-4`}>
        <div className='w-full flex justify-end mb-3'>
          <button onClick={startForm} className={`${form ? "bg-red-500 hover:bg-red-700" : ""} rounded-full cursor-pointer
          w-22 h-auto bg-emerald-600 outline-2 hover:outline-2 hover:outline-emerald-300 hover:bg-emerald-500 hover:duration-300 ease-out text-zinc-50 border border-emerald-700`}>Create</button>
        </div>
        <Router>
          <div className={`${form ? "opacity-0" : "opacity-100"} transition-all duration-300`}>
          <div className={`w-full mb-2`}>
            <p className='text-xl font-bold'>Events</p>
          </div>
          <div className='flex flex-col items-start gap-2 w-full font-bold overflow-y-auto pr-1'>
            {names.length > 0 ? names : (
              <p className='w-full text-left text-zinc-400 font-normal'>No events yet. Click Create to add one.</p>
            )}
          </div>
          </div>
          <Routes>
            <Route path='/' element={''}></Route>
            <Route path='/event' element={<Event />}></Route>
            <Route path='/event/signin' element={<Sign />}></Route>
            <Route path='/event/register' element={<RegistrationSys />}></Route>
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App
