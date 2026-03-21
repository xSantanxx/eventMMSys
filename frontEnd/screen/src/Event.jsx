import './Event.css'
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';


function Event() {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reg, setReg] = useState(0);
    const [sign, setSign] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();
    const eventId = location.state?.eventId || sessionStorage.getItem('selectedEventId');

    useEffect(() => {
        if (!eventId) {
            navigate('/');
            return;
        }
        sessionStorage.setItem('selectedEventId', eventId);

        async function eventInfo(){
            const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${eventId}`);
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
    }, [eventId, navigate])

const homeScreen = () => {
    sessionStorage.removeItem('selectedEventId');
    navigate(`/`);
}


    return(
        <div className='fixed inset-0 z-50 bg-zinc-950/70 flex items-center justify-center p-4' onClick={homeScreen}>
        <div className='flex flex-col relative rounded-xl bg-zinc-900 text-zinc-100 border-2 border-solid border-zinc-800 w-[min(92vw,680px)] min-h-[420px]' onClick={(e) => e.stopPropagation()}>
            <div className='flex justify-center items-center bg-sky-900/40 rounded-t-lg w-full h-24'>
                <div className='hover:bg-red-500 duration-300 bg-red-600 flex items-center rounded-full justify-center absolute top-[2%] left-[2%] hover:outline-red-500 hover:outline-2 w-5'>
                    <button onClick={homeScreen} className='cursor-pointer'><p className='text-center text-zinc-50 text-sm duration-300 opacity-0 hover:opacity-50'>x</p></button>
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
                    <Link to='/event/register' state={{ eventId }} className='w-full'>
                        <button className='w-full border border-solid border-emerald-700/70 rounded-xl py-3 text-lg font-semibold duration-300 bg-emerald-600 hover:bg-emerald-500 hover:border-emerald-400 hover:border-2 cursor-pointer'>
                            Register
                        </button>
                    </Link>
                    <Link to='/event/signin' state={{ eventId }} className='w-full'>
                        <button className='w-full border border-solid border-emerald-700/70 rounded-xl py-3 text-lg font-semibold duration-300 bg-emerald-600 hover:bg-emerald-500 hover:border-emerald-400 hover:border-2 cursor-pointer'>
                            Sign in
                        </button>
                    </Link>
                </div>
            </div>
        </div>
        </div>
    )
}

export default Event;