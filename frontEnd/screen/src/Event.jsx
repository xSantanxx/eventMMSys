import { useParams } from 'react-router-dom';
import './Event.css'
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import RegistrationSys from './RegistrationSys';
import Sign from './Sign';


function Event() {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reg, setReg] = useState(0);
    const [sign, setSign] = useState(0);

    useEffect(() => {
        async function eventInfo(){
            const idurl = window.location.pathname;
            const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${id}`);
            const data = await response.json();

            const date = new Date(data[0].date);
            const createdAtRaw = data[0].created_at;
            const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(String(createdAtRaw));
            const createdAtIso = hasTimezone
                ? String(createdAtRaw)
                : `${String(createdAtRaw).replace(' ', 'T')}Z`;
            const time = new Date(createdAtIso);
            
            const fullDate = date.toLocaleDateString('en-US')
            const fullTime = time.toLocaleTimeString('en-US')

            setName(data[0].name)
            setDesc(data[0].description)
            setDate(fullDate)
            setTime(fullTime)
            setReg(data[0].registered)
            setSign(data[0].checked_in)

        }
        eventInfo();
    }, [])

const {id} = useParams();

const navigate = useNavigate();

const homeScreen = () => {
    navigate(`/`);
}


    return(
        <div className='flex flex-col absolute rounded-xl bg-zinc-200 left-1/2 -translate-x-1/2 top-[-180%] border-2 border-solid w-[min(92vw,680px)] min-h-[420px]'>
            <div className='flex justify-center items-center bg-sky-200 rounded-t-lg w-full h-24'>
                <div className='hover:bg-red-700 duration-300 bg-red-500 flex items-center rounded-full justify-center absolute top-[2%] left-[2%] hover:outline-red-500 hover:outline-2 w-5'>
                    <button onClick={homeScreen} className='cursor-pointer'><p className='text-center text-black text-sm duration-300 opacity-0 hover:opacity-50'>x</p></button>
                    </div>
                <div><p className='font-bold text-2xl'>{name}</p></div>
            </div>
            <div className='my-5 mx-4 flex flex-col overflow-x-auto'>
                <p className='text-2xl font-bold'>Description: {desc}</p>
                <p className='my-5 text-2xl font-bold'>Date: {date}</p>
                <p className='mb-2 text-2xl font-bold'>Time: {time}</p>
                <p className='my-2 text-2xl font-bold'>Registered: {reg}</p>
                <p className='my-2 text-2xl font-bold'>Signed In: {sign}</p>
                <div className='mt-4 flex flex-col sm:flex-row gap-3'>
                    <Link to={`/${id}/register`} className='w-full'>
                        <button className='w-full border border-solid rounded-xl py-3 text-lg font-semibold duration-300 bg-green-500 hover:bg-green-700 hover:border-cyan-700 hover:border-2 cursor-pointer'>
                            Register
                        </button>
                    </Link>
                    <Link to={`/${id}/signin`} className='w-full'>
                        <button className='w-full border border-solid rounded-xl py-3 text-lg font-semibold duration-300 bg-green-500 hover:bg-green-700 hover:border-cyan-700 hover:border-2 cursor-pointer'>
                            Sign in
                        </button>
                    </Link>
                </div>
                <Routes>
                    <Route path='/:id/register' element={<RegistrationSys />}></Route>
                    <Route path='/:id/signin' element={<Sign />}></Route>
                </Routes>
            </div>
        </div>
    )
}

export default Event;