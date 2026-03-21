import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Sign.css'
import {Scanner} from '@yudiel/react-qr-scanner'


function Sign(){

const location = useLocation();
const eventId = location.state?.eventId || sessionStorage.getItem('selectedEventId');
const navigate = useNavigate();

useEffect(() => {
    if (!eventId) {
        navigate('/');
        return;
    }
    sessionStorage.setItem('selectedEventId', eventId);
}, [eventId, navigate]);

const checkIn = async (result) => {
    try{
        const checkId = result[0].rawValue

        const methodOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user: checkId})
        }

        const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${eventId}/signin`, methodOptions);
        const data = await response.text();
        alert(data);
    } catch (err) {
        console.log(err)
    }
}

const backPage = () => {
    navigate('/event', { state: { eventId } });
}

    return(
        <div className='bg-zinc-900 overflow-x-auto absolute left-1/2 -translate-x-1/2 top-[-200%] rounded-xl border-2 border-solid border-zinc-800 text-zinc-100 w-[min(92vw,680px)] min-h-[420px]'>
            <div className='relative w-full h-20 bg-sky-900/40 rounded-t-lg flex items-center justify-center'>
                <p className='text-2xl font-bold'>Sign In</p>
                <div className='hover:outline-red-500 hover:outline-2 hover:bg-red-700 duration-300 bg-red-500 absolute left-[1%] rounded-full w-5 flex justify-center px-2
                '>
                    <button onClick={backPage} className='cursor-pointer'>
                        <p className='text-center text-white text-sm opacity-0 hover:opacity-50'>x</p>
                        </button>
                        </div>
            </div>
            <div className='p-4'>
                <Scanner onScan={checkIn}></Scanner>
            </div>
        </div>
    )
}


export default Sign