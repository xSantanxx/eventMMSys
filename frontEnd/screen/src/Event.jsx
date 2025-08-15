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

    useEffect(() => {
        async function eventInfo(){
            const idurl = window.location.pathname;
            const response = await fetch(`http://localhost:${import.meta.env.VITE_PORT}/${id}`);
            const data = await response.json();

            const date = new Date(data[0].date);
            const time = new Date(data[0].created_at);
            // console.log(time.toLocaleTimeString());
            
            const fullDate = date.toLocaleDateString('en-US')
            const fullTime = time.toLocaleTimeString('en-US')

            setName(data[0].name)
            setDesc(data[0].description)
            setDate(fullDate)
            setTime(fullTime)


        }
        eventInfo();
    }, [])

const {id} = useParams();

const navigate = useNavigate();

const homeScreen = () => {
    navigate(`/`);
}


    return(
        <div className='flex flex-col absolute rounded-xl bg-red-500 left-[32%] top-[23%] border-2 border-solid w-2/5 h-96
        '>
            <div className='flex justify-center items-center bg-cyan-500 rounded-t-lg w-full h-24'>
                <div className='hover:bg-red-700 duration-300 bg-red-500 flex items-center rounded-full justify-center absolute top-[2%] left-[2%] border-2 border-solid w-7'>
                    <button onClick={homeScreen} className='cursor-pointer'><p className='duration-300 opacity-0 hover:opacity-50'>x</p></button>
                    </div>
                <div><p>{name}</p></div>
            </div>
            <div className='my-5 mx-2 flex flex-col overflow-x-auto'>
                <p className='text-2xl font-bold'>Description: {desc}</p>
                <p className='my-15 text-2xl font-bold'>Date: {date}</p>
                <p className='text-2xl font-bold'>Time: {time}</p>
                <Link to={`/${id}/register`}><div
                className='border-1 justify-self-center rounded-xl flex justify-center duration-300 bg-green-500 hover:bg-green-700 hover:border-cyan-700
                hover:border-2 border-solid w-20 px-2 mb-2'><button>Register</button></div></Link>
                <Link to={`/${id}/signin`}>
                <div className='border-1 justify-self-center flex justify-center rounded-xl duration-300 bg-green-500 hover:bg-green-700 hover:border-cyan-700
                hover:border-2 border-solid w-20 px-2'><button>Sign in</button></div>
                </Link>
                <Routes>
                    <Route path='/:id/register' element={<RegistrationSys />}></Route>
                    <Route path='/:id/signin' element={<Sign />}></Route>
                </Routes>
            </div>
        </div>
    )
}

export default Event;